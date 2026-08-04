// OLD project: app/api/auth/google-signin/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, name, image } = await req.json();

    console.log("google-signin called:", { email, name }); // 👈 debug

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { profilePic: image ?? undefined },
      create: {
        email,
        username: null,
        name: name ?? null,
        profilePic: image ?? null,
        isVerified: true,
      },
    });

    console.log("google-signin user:", user.id); // 👈 debug

    return NextResponse.json({ user });
  } catch (err) {
    console.error("google-signin error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}