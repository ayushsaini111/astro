import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const MIN_TALKTIME_SECONDS = 5; // 15 minutes required PER redeem cycle

async function authenticate(req) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return null;
  }
}

async function getBalanceInfo(panditId) {
  // ✅ Find the most recent payout request (any status) — this marks
  // the cutoff point. Talk time is only counted AFTER this date.
  const lastRequest = await prisma.payoutRequest.findFirst({
    where: { panditId },
    orderBy: { requestedAt: "desc" },
    select: { requestedAt: true },
  });

  const cutoffDate = lastRequest?.requestedAt || new Date(0); // epoch if never redeemed

  const calls = await prisma.call.findMany({
    where: { panditId, status: "COMPLETED" },
    select: { totalCost: true, duration: true, endTime: true, createdAt: true },
  });

  const totalEarnings = calls.reduce((sum, c) => sum + (c.totalCost || 0), 0);

  // ✅ Lifetime talk time (for display purposes only, not eligibility)
  const totalTalkSeconds = calls.reduce((sum, c) => sum + (c.duration || 0), 0);

  // ✅ NEW — talk time accumulated ONLY since the last redeem request
  const talkSecondsSinceLastRedeem = calls.reduce((sum, c) => {
    const callTime = c.endTime || c.createdAt;
    if (callTime && new Date(callTime) > cutoffDate) {
      return sum + (c.duration || 0);
    }
    return sum;
  }, 0);

  const requests = await prisma.payoutRequest.findMany({
    where: { panditId, status: { in: ["PENDING", "PROCESSING", "PAID"] } },
    select: { amount: true },
  });
  const alreadyRequested = requests.reduce((sum, r) => sum + r.amount, 0);

  const availableBalance = Math.max(0, totalEarnings - alreadyRequested);

  // ✅ Eligibility now depends on FRESH talk time since last redeem,
  // not lifetime cumulative total
  const isEligible =
    talkSecondsSinceLastRedeem >= MIN_TALKTIME_SECONDS && availableBalance > 0;

  return {
    totalEarnings,
    availableBalance,
    totalTalkSeconds,              // lifetime — for stats/display
    talkSecondsSinceLastRedeem,    // ✅ used for eligibility
    isEligible,
    lastRedeemAt: lastRequest?.requestedAt || null,
  };
}

// GET — balance + eligibility + history
export async function GET(req) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const balanceInfo = await getBalanceInfo(payload.id);

    const history = await prisma.payoutRequest.findMany({
      where: { panditId: payload.id },
      orderBy: { requestedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ ...balanceInfo, history });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — create a redeem request
export async function POST(req) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pandit = await prisma.pandit.findUnique({ where: { id: payload.id } });

    if (!pandit.bankDetailsAdded) {
      return NextResponse.json(
        { error: "BANK_DETAILS_REQUIRED", message: "Please add your bank/UPI details first" },
        { status: 400 }
      );
    }

    const balanceInfo = await getBalanceInfo(payload.id);

    // ✅ Check FRESH talk time since last redeem, not lifetime total
    if (balanceInfo.talkSecondsSinceLastRedeem < MIN_TALKTIME_SECONDS) {
      const remainingSeconds = MIN_TALKTIME_SECONDS - balanceInfo.talkSecondsSinceLastRedeem;
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return NextResponse.json(
        {
          error: `You need ${remainingMinutes} more minute${remainingMinutes !== 1 ? "s" : ""} of talk time since your last redeem to request again.`,
        },
        { status: 400 }
      );
    }

    if (balanceInfo.availableBalance <= 0) {
      return NextResponse.json(
        { error: "No available balance to redeem." },
        { status: 400 }
      );
    }

    const payout = await prisma.payoutRequest.create({
      data: {
        panditId: payload.id,
        amount: balanceInfo.availableBalance,
        status: "PENDING",
        accountHolderName: pandit.accountHolderName,
        accountNumber: pandit.accountNumber,
        ifsc: pandit.ifsc,
        upiId: pandit.upiId,
      },
    });

    return NextResponse.json({ success: true, payout });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}