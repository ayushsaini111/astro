import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    let panditId = null;

    // -------------------------
    // Try Mobile JWT
    // -------------------------
    const auth = req.headers.get("authorization");

    if (auth?.startsWith("Bearer ")) {
      try {
        const token = auth.replace("Bearer ", "");

        const payload = jwt.verify(
          token,
          process.env.NEXTAUTH_SECRET
        );

        panditId = payload.id;
      } catch (e) {
        console.log("JWT auth failed");
      }
    }

    // -------------------------
    // Try Website Session
    // -------------------------
    if (!panditId) {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id || session.user.role !== "pandit") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      panditId = session.user.id;
    }

    // -------------------------
    // Update Availability
    // -------------------------
    const { isAvailable } = await req.json();

    await prisma.pandit.update({
      where: {
        id: panditId,
      },
      data: {
        isAvailable,
      },
    });

    return NextResponse.json({
      success: true,
      isAvailable,
    });
  } catch (err) {
    console.error(err);

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