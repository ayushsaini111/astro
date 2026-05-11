import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { username, dob } = await req.json();

    console.log("📦 set-username body:", { username, dob });

    if (!username || !dob) {
      return NextResponse.json(
        { error: "Username and DOB required" },
        { status: 400 }
      );
    }

    // Get userId from cookie — set by both OTP and Google login
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    console.log("📦 userId from cookie:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "Session expired. Please login again." },
        { status: 401 }
      );
    }

    // Check username not taken
    const existing = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: userId },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        dob: new Date(dob),
      },
    });

    console.log("✅ Profile complete for:", user.id);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ set-username error:", err.message);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}