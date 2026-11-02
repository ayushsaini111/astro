import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { getOrCreateCommunityPlan } from "@/lib/communityPlan";

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const razorpay = getRazorpay();
    const planId = await getOrCreateCommunityPlan();

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120,
      notes: { userId }, // 👈 critical: this is how verify() AND the webhook fallback
                          // later figure out which user this subscription belongs to
    });

    // 🚫 No CommunityJoin row created here anymore.
    // A row now only ever gets created once a real payment is confirmed —
    // either by verify/route.js (normal path) or by the webhook fallback (safety net).

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("💥 community/subscribe error:", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}