import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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

// ✅ shared validator — same logic as redeem route
function hasValidBankDetails(pandit) {
  if (!pandit.payoutMethod) return false;
  if (pandit.payoutMethod === "BANK") {
    return !!(
      pandit.accountHolderName?.trim() &&
      pandit.accountNumber?.trim() &&
      pandit.ifsc?.trim()
    );
  }
  if (pandit.payoutMethod === "UPI") {
    return !!(pandit.upiId?.trim() && pandit.upiId.includes("@"));
  }
  return false;
}

// GET — fetch saved bank details
export async function GET(req) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pandit = await prisma.pandit.findUnique({
    where: { id: payload.id },
    select: {
      accountHolderName: true,
      accountNumber: true,
      ifsc: true,
      upiId: true,
      payoutMethod: true,
      bankDetailsAdded: true,
    },
  });

  // ✅ Self-heal — always return the REAL status, computed fresh,
  // in case the stored flag is stale/incorrect
  const actuallyValid = hasValidBankDetails(pandit);

  return NextResponse.json({
    ...pandit,
    bankDetailsAdded: actuallyValid, // ✅ overrides stale flag
  });
}

// POST — save/update bank details
export async function POST(req) {
  const payload = await authenticate(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { payoutMethod, accountHolderName, accountNumber, ifsc, upiId } = body;

  if (payoutMethod === "BANK") {
    if (!accountHolderName?.trim() || !accountNumber?.trim() || !ifsc?.trim()) {
      return NextResponse.json({ error: "All bank fields are required" }, { status: 400 });
    }
  } else if (payoutMethod === "UPI") {
    if (!upiId?.trim() || !upiId.includes("@")) {
      return NextResponse.json({ error: "Enter a valid UPI ID" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Invalid payout method" }, { status: 400 });
  }

  await prisma.pandit.update({
    where: { id: payload.id },
    data: {
      payoutMethod,
      accountHolderName: payoutMethod === "BANK" ? accountHolderName.trim() : null,
      accountNumber: payoutMethod === "BANK" ? accountNumber.trim() : null,
      ifsc: payoutMethod === "BANK" ? ifsc.trim() : null,
      upiId: payoutMethod === "UPI" ? upiId.trim() : null,
      bankDetailsAdded: true,
    },
  });

  return NextResponse.json({ success: true });
}