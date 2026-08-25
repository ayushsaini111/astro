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

  const user = getUserFromHeaders(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const joined = await prisma.communityJoin.findUnique({
    where: { userId: user.id },
    select: { joinedAt: true },
  });

  return NextResponse.json({ joined: !!joined, joinedAt: joined?.joinedAt ?? null });
}

export async function POST(request) {
  const user = getUserFromHeaders(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await prisma.communityJoin.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return NextResponse.json({ joined: true, joinedAt: record.joinedAt });
}