import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");

    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    let payload;

    try {
      payload = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const pandit = await prisma.pandit.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!pandit) {
      return NextResponse.json(
        { error: "Pandit not found" },
        { status: 404 }
      );
    }

    const calls = await prisma.call.findMany({
      where: {
        panditId: pandit.id,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedCalls = calls.map(call => ({
      ...call,
      displayUsername:
        call.user?.username ||
        call.deletedUsername ||
        "Deleted User",
    }));

    return NextResponse.json({
      calls: formattedCalls,
      isAvailable: pandit.isAvailable,
    });
  } catch (err) {
    console.log(err);

    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}