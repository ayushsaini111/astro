import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      balance: wallet?.balance || 0,
      transactions,
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}