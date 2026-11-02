import { NextResponse } from "next/server";
import { getActiveRedeemCode } from "@/lib/redeem";

export async function POST(req) {
  const { code } = await req.json();
  const redeem = await getActiveRedeemCode(code);
  if (!redeem) return NextResponse.json({ valid: false });

  return NextResponse.json({
    valid: true,
    discountPercent: redeem.discountPercent,
    partnerName: redeem.partner.name,
  });
}