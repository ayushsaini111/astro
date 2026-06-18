import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "pandit") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get all transactions for this pandit
    const transactions = await prisma.transaction.findMany({
      where: {
        callBillings: {
          some: {
            call: {
              panditId: session.user.id,
            },
          },
        },
      },
      include: {
        callBillings: {
          include: {
            call: {
              select: {
                duration: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Map transactions with call data
    const mappedTransactions = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      purpose: t.purpose,
      status: t.status,
      createdAt: t.createdAt,
      callId: t.callBillings[0]?.callId,
      call: t.callBillings[0]?.call,
    }));

    return NextResponse.json({ transactions: mappedTransactions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}