import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, dob, gender, address, phone, email } = await req.json();

    const user = await prisma.user.findUnique({
      where: session.user.email
        ? { email: session.user.email }
        : { id: session.user.id },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check username not taken by someone else
    if (username && username !== user.username) {
      const taken = await prisma.user.findFirst({
        where: { username, NOT: { id: user.id } },
      });
      if (taken) return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // Check email not taken by someone else
    if (email && email !== user.email) {
      const taken = await prisma.user.findFirst({
        where: { email, NOT: { id: user.id } },
      });
      if (taken) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(username ? { username } : {}),
        ...(email    ? { email }    : {}),
        ...(phone    ? { phone }    : {}),
        ...(dob      ? { dob: new Date(dob) } : {}),
        ...(gender   ? { gender }   : {}),
        ...(address  ? { address }  : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("update-profile error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}