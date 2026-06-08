import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const { username, dob } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Session expired. Please login again." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: session.user.email
        ? { email: session.user.email }
        : { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found. Please login again." }, { status: 401 });
    }

    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        // ✅ only set dob if provided, don't overwrite with null if skipped
        ...(dob ? { dob: new Date(dob) } : {}),
      },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ set-username error:", err.message);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}