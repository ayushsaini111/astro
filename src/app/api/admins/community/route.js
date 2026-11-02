import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const status = searchParams.get("status"); // ACTIVE | PENDING | PAST_DUE | HALTED | CANCELLED | COMPLETED | "all"
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("dateFrom"); // "2024-01-01"
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "joinedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const allowedSortFields = ["joinedAt", "currentEnd", "amount", "lastChargedAt", "status"];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "joinedAt";

    const where = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.joinedAt = {};
      if (dateFrom) where.joinedAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.joinedAt.lte = end;
      }
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [joins, total, statusCounts] = await Promise.all([
      prisma.communityJoin.findMany({
        where,
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          // ⚠️ assumes CommunityJoin → CommunityPayment relation is named "payments" —
          // confirm against your schema.prisma; rename here if it's different
          payments: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, amount: true, status: true, razorpayPaymentId: true, createdAt: true },
          },
        },
      }),
      prisma.communityJoin.count({ where }),
      prisma.communityJoin.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    const summary = statusCounts.reduce((acc, row) => {
      acc[row.status] = row._count.status;
      return acc;
    }, {});

    return NextResponse.json({
      joins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary,
    });
  } catch (err) {
    console.error("💥 admins/community GET error:", err);
    return NextResponse.json({ error: "Failed to fetch community joins" }, { status: 500 });
  }
}