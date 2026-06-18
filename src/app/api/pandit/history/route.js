import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "pandit") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("showAll") === "true";

    // ✅ Paginated calls for display (10 or all)
    const calls = await prisma.call.findMany({
      where: { panditId: session.user.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      ...(showAll ? {} : { take: 10 }),
    });

    return NextResponse.json({ calls });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}