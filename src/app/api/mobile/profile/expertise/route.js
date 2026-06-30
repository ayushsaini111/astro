import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function PATCH(req) {
  try {
    // -----------------------------
    // Verify JWT
    // -----------------------------
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

    // -----------------------------
    // Body
    // -----------------------------
    const body = await req.json();

    const {
      speciality,
      languages,
    } = body;

    const updateData = {};

    if (speciality !== undefined) {
      if (!Array.isArray(speciality)) {
        return NextResponse.json(
          {
            error: "Speciality must be an array",
          },
          {
            status: 400,
          }
        );
      }

      updateData.speciality = speciality.filter(Boolean);
    }

    if (languages !== undefined) {
      if (!Array.isArray(languages)) {
        return NextResponse.json(
          {
            error: "Languages must be an array",
          },
          {
            status: 400,
          }
        );
      }

      updateData.languages = languages.filter(Boolean);
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
        speciality: true,
        languages: true,
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