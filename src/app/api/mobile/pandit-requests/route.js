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
        user: {
          select: {
            id: true,
            username: true,
            dob: true,
          },
        },
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
      pending: formattedCalls.filter(c =>
        ["INITIATED", "RINGING"].includes(c.status)
      ),
      accepted: formattedCalls.filter(c =>
        ["ONGOING", "COMPLETED"].includes(c.status)
      ),
      missed: formattedCalls.filter(
        c => c.status === "FAILED"
      ),
    });
  } catch (err) {
    console.error("Mobile Requests:", err);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}