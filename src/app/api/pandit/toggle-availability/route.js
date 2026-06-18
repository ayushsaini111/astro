import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { panditId, isAvailable } = await req.json();

  if (panditId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.pandit.update({
      where: { id: panditId },
      data: { isAvailable },
    });

    return NextResponse.json({ success: true, isAvailable });
  } catch (error) {
    console.error("Toggle availability error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}