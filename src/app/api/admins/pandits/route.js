import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function hasValidBankDetails(p) {
  if (p.payoutMethod === "BANK") {
    return !!(p.accountHolderName?.trim() && p.accountNumber?.trim() && p.ifsc?.trim());
  }
  if (p.payoutMethod === "UPI") {
    return !!(p.upiId?.trim() && p.upiId.includes("@"));
  }
  return false;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status"); // available | unavailable
    const sortBy = searchParams.get("sortBy") || "earnings";
    const basic = searchParams.get("basic") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));

    // ✅ lightweight list for dropdowns (used in payouts page filter)
    if (basic) {
      const pandits = await prisma.pandit.findMany({
        select: { id: true, name: true, username: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ success: true, pandits });
    }

    const pandits = await prisma.pandit.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        email: true,
        isAvailable: true,
        ratePerMin: true,
        createdAt: true,
        payoutMethod: true,
        accountHolderName: true,
        accountNumber: true,
        ifsc: true,
        upiId: true,
        calls: {
          where: { status: "COMPLETED" },
          select: { totalCost: true, duration: true },
        },
        payoutRequests: {
          orderBy: { requestedAt: "desc" },
          select: {
            id: true,
            amount: true,
            status: true,
            requestedAt: true,
            processedAt: true,
            adminNotes: true,
          },
        },
      },
    });

    let result = pandits.map((p) => {
      const totalEarnings = p.calls.reduce((s, c) => s + (c.totalCost || 0), 0);
      const totalTalkSeconds = p.calls.reduce((s, c) => s + (c.duration || 0), 0);
      const totalCalls = p.calls.length;

      const totalPaid = p.payoutRequests
        .filter((r) => r.status === "PAID")
        .reduce((s, r) => s + r.amount, 0);

      const pendingAmount = p.payoutRequests
        .filter((r) => r.status === "PENDING" || r.status === "PROCESSING")
        .reduce((s, r) => s + r.amount, 0);

      const availableBalance = Math.max(0, totalEarnings - totalPaid - pendingAmount);
      const lastPayout = p.payoutRequests[0] || null;

      return {
        id: p.id,
        name: p.name,
        username: p.username,
        phone: p.phone,
        email: p.email,
        isAvailable: p.isAvailable,
        ratePerMin: p.ratePerMin,
        joinedAt: p.createdAt,
        hasBankDetails: hasValidBankDetails(p),
        payoutMethod: p.payoutMethod,
        upiId: p.upiId,
        accountHolderName: p.accountHolderName,
        accountNumber: p.accountNumber,
        ifsc: p.ifsc,
        totalEarnings,
        totalTalkSeconds,
        totalCalls,
        totalPaid,
        pendingAmount,
        availableBalance,
        lastPayout, // { amount, status, requestedAt, processedAt, adminNotes }
      };
    });

    if (status === "available") result = result.filter((p) => p.isAvailable);
    if (status === "unavailable") result = result.filter((p) => !p.isAvailable);

    result.sort((a, b) => {
      if (sortBy === "talktime") return b.totalTalkSeconds - a.totalTalkSeconds;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.totalEarnings - a.totalEarnings;
    });

    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paged = result.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      pandits: paged,
      page,
      totalPages,
      total,
    });
  } catch (err) {
    console.error("❌ Get pandits error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}