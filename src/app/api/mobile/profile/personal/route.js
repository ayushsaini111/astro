import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function PATCH(req) {
  try {
    // ----------------------------
    // Verify JWT
    // ----------------------------
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

    // ----------------------------
    // Parse Body
    // ----------------------------
    const body = await req.json();

    const {
      name,
      email,
      phone,
      about,
    } = body;

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }

      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { error: "Email cannot be empty" },
          { status: 400 }
        );
      }

      updateData.email = email.trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return NextResponse.json(
          { error: "Phone cannot be empty" },
          { status: 400 }
        );
      }

      updateData.phone = phone.trim();
    }

    if (about !== undefined) {
      updateData.about = about.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: "Nothing to update",
        },
        {
          status: 400,
        }
      );
    }

    const updated = await prisma.pandit.update({
      where: {
        id: payload.id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        about: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
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