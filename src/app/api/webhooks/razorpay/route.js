import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications/send";

// ✅ Razorpay signs the exact raw request body — must verify against the raw text,
// not a re-serialized JSON.parse(...).stringify(...), which can silently differ byte-for-byte
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (!signature || expected !== signature) {
    console.error("⚠️ Invalid Razorpay webhook signature");
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const body = JSON.parse(rawBody);
  const event = body.event;

  try {
    switch (event) {
      case "subscription.charged":
        await handleCharged(body.payload);
        break;
      case "subscription.activated":
        await handleActivated(body.payload);
        break;
      case "subscription.pending":
        await handlePending(body.payload);
        break;
      case "subscription.halted":
        await handleHalted(body.payload);
        break;
      case "subscription.cancelled":
        await handleCancelled(body.payload);
        break;
      case "subscription.completed":
        await handleCompleted(body.payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(body.payload);
        break;
      default:
        console.log("ℹ️ Unhandled Razorpay webhook event:", event);
    }

    // ✅ Always 200 on a successfully-processed (or intentionally-ignored) event —
    // Razorpay retries non-2xx responses with backoff, which would otherwise pile up
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`💥 Webhook handler failed for ${event}:`, error);
    // ✅ 500 ONLY on genuine processing failure (e.g. DB down) so Razorpay retries —
    // returning 200 here would silently drop a real monthly charge event forever
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function findJoinBySubscription(subEntity) {
  const id = subEntity?.id;
  if (!id) return null;
  return prisma.communityJoin.findUnique({ where: { razorpaySubscriptionId: id } });
}

// ✅ NEW — used only by handlers that can legitimately be the FIRST event Razorpay
// ever sends for a subscription (charged, activated). If no row exists yet
// (e.g. verify() hasn't run, or the client crashed before calling it), this
// creates it from the subscription's notes.userId instead of silently dropping
// a real successful payment.
async function findOrCreateJoin(subEntity) {
  const existing = await findJoinBySubscription(subEntity);
  if (existing) return existing;

  const userId = subEntity?.notes?.userId;
  if (!userId) {
    console.error(
      "⚠️ Webhook: no CommunityJoin row and no userId in subscription.notes — cannot recover:",
      subEntity?.id
    );
    return null;
  }

  const created = await prisma.communityJoin.upsert({
    where: { userId },
    update: { razorpaySubscriptionId: subEntity.id },
    create: {
      userId,
      razorpaySubscriptionId: subEntity.id,
      status: "PENDING",
      amount: 0,
    },
  });

  console.log("🔧 Webhook fallback-created missing join row:", created.id, "for sub", subEntity.id);
  return created;
}

async function handleCharged(payload) {
  const subEntity = payload.subscription.entity;
  const paymentEntity = payload.payment.entity;

  // 👇 uses the fallback-create version — this IS the safety net for a lost client-side verify() call
  const join = await findOrCreateJoin(subEntity);
  if (!join) {
    console.error("⚠️ subscription.charged for unrecoverable subscription:", subEntity.id);
    return;
  }

  const already = await prisma.communityPayment.findUnique({
    where: { razorpayPaymentId: paymentEntity.id },
  });

  if (already) {
    // ✅ Instead of blindly skipping, repair the amount if an earlier
    // verify() call (or a previous partial failure) left it at 0
    if (already.amount === 0 && paymentEntity.amount > 0) {
      await prisma.communityPayment.update({
        where: { id: already.id },
        data: { amount: paymentEntity.amount, status: "PAID" },
      });
      console.log("🔧 Repaired amount=0 payment record:", paymentEntity.id);
    } else {
      console.log("ℹ️ Duplicate webhook for payment, skipping:", paymentEntity.id);
    }
    return;
  }

  await prisma.communityPayment.create({
    data: {
      communityJoinId: join.id,
      razorpayPaymentId: paymentEntity.id,
      amount: paymentEntity.amount,
      status: "PAID",
    },
  });

  await prisma.communityJoin.update({
    where: { id: join.id },
    data: {
      status: "ACTIVE",
      amount: paymentEntity.amount,
      currentStart: subEntity.current_start ? new Date(subEntity.current_start * 1000) : new Date(),
      currentEnd: subEntity.current_end ? new Date(subEntity.current_end * 1000) : null,
      lastChargedAt: new Date(),
    },
  });

  // ✅ This is the FCM notification sent on EVERY successful auto-pay charge —
  // first payment AND every monthly renewal after it, since this handler fires every time.
  if (join.userId) {
    sendNotification({
      userId: join.userId,
      type: "CUSTOM",
      title: "✅ Membership Renewed",
      body: `₹${(paymentEntity.amount / 100).toFixed(2)} was auto-debited for your monthly community membership.`,
      data: { screen: "CommunityDetails" },
    }).catch((e) => console.error("⚠️ Notification failed:", e));
  }
}

async function handleActivated(payload) {
  const subEntity = payload.subscription.entity;
  // 👇 also uses fallback-create — `activated` can arrive as the very first event
  // for a subscription in some timing scenarios, same risk as `charged`
  const join = await findOrCreateJoin(subEntity);
  if (!join) return;
  await prisma.communityJoin.update({ where: { id: join.id }, data: { status: "ACTIVE" } });
}

async function handlePending(payload) {
  // Razorpay auto-retries the charge for a few days — don't flap status, just warn.
  // No fallback-create here: a "pending" event implies a prior charge already
  // happened once, so a missing row means something else is wrong — safe to skip.
  const join = await findJoinBySubscription(payload.subscription.entity);
  if (!join) return;

  await prisma.communityJoin.update({ where: { id: join.id }, data: { status: "PAST_DUE" } });

  if (join.userId) {
    sendNotification({
      userId: join.userId,
      type: "CUSTOM",
      title: "⚠️ Payment Pending",
      body: "We couldn't auto-renew your community membership. Please check your payment method.",
      data: { screen: "CommunityDetails" },
    }).catch((e) => console.error("⚠️ Notification failed:", e));
  }
}

async function handleHalted(payload) {
  // Razorpay gives up after repeated failures — subscription is now dead until re-subscribe
  const join = await findJoinBySubscription(payload.subscription.entity);
  if (!join) return;

  await prisma.communityJoin.update({
    where: { id: join.id },
    data: { status: "HALTED", haltedAt: new Date() },
  });

  if (join.userId) {
    sendNotification({
      userId: join.userId,
      type: "CUSTOM",
      title: "❌ Membership Paused",
      body: "Your community membership was paused due to repeated payment failures. Rejoin anytime.",
      data: { screen: "CommunityDetails" },
    }).catch((e) => console.error("⚠️ Notification failed:", e));
  }
}

async function handleCancelled(payload) {
  const join = await findJoinBySubscription(payload.subscription.entity);
  if (!join) return;

  await prisma.communityJoin.update({
    where: { id: join.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  if (join.userId) {
    sendNotification({
      userId: join.userId,
      type: "CUSTOM",
      title: "Membership Cancelled",
      body: "Your community membership auto-renewal has been cancelled.",
      data: { screen: "CommunityDetails" },
    }).catch((e) => console.error("⚠️ Notification failed:", e));
  }
}

async function handleCompleted(payload) {
  const join = await findJoinBySubscription(payload.subscription.entity);
  if (!join) return;
  await prisma.communityJoin.update({ where: { id: join.id }, data: { status: "COMPLETED" } });
}

async function handlePaymentFailed(payload) {
  const paymentEntity = payload.payment.entity;
  const subscriptionId = paymentEntity.subscription_id;
  if (!subscriptionId) return; // not subscription-related, ignore (e.g. a pooja/product order failure)

  const join = await prisma.communityJoin.findUnique({ where: { razorpaySubscriptionId: subscriptionId } });
  if (!join?.userId) return;

  sendNotification({
    userId: join.userId,
    type: "CUSTOM",
    title: "⚠️ Auto-Payment Failed",
    body: "Your monthly community payment failed. Razorpay will retry automatically over the next few days.",
    data: { screen: "CommunityDetails" },
  }).catch((e) => console.error("⚠️ Notification failed:", e));
}