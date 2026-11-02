import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserFromHeaders(request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return null;
  return { id: userId };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get("all") === "true";

  if (isAdmin) {
    const joins = await prisma.communityJoin.findMany({
      orderBy: { joinedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
    return NextResponse.json({ count: joins.length, joins });
  }

  // ✅ Support both header (x-user-id) and query param (?userId=) since the
  // RN client currently sends it as a query param — header takes priority
  // if your other routes rely on it, but we fall back so this never silently 401s.
  const headerUser = getUserFromHeaders(request);
  const userId = headerUser?.id || searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ joined: false, status: null, joinedAt: null, currentEnd: null });
  }

  const join = await prisma.communityJoin.findUnique({
    where: { userId },
    select: { status: true, joinedAt: true, currentEnd: true },
  });

  // ✅ THE FIX — "joined" now means status is genuinely ACTIVE (i.e. payment
  // was verified and/or a subscription.charged webhook confirmed it),
  // NOT merely "a row exists in the table"
  return NextResponse.json({
    joined: join?.status === "ACTIVE",
    status: join?.status || null,
    joinedAt: join?.joinedAt || null,
    currentEnd: join?.currentEnd || null,
  });
}