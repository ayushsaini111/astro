// app/api/mobile/profile/avatar/route.js

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(req) {
  try {
    // --------------------------
    // Verify Token
    // --------------------------
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    let payload;

    try {
      payload = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET
      );
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // --------------------------
    // Request Body
    // --------------------------
    const {
      profilePic,
      profilePicPublicId,
    } = await req.json();

    if (!profilePic || !profilePicPublicId) {
      return NextResponse.json(
        {
          error:
            "profilePic and profilePicPublicId are required",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------
    // Get Current Pandit
    // --------------------------
    const pandit = await prisma.pandit.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        profilePic: true,
        profilePicPublicId: true,
      },
    });

    if (!pandit) {
      return NextResponse.json(
        {
          error: "Pandit not found",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------
    // Delete Previous Avatar
    // --------------------------
    if (pandit.profilePicPublicId) {
      try {
        console.log(
          "Deleting old avatar:",
          pandit.profilePicPublicId
        );

        await deleteFromCloudinary(
          pandit.profilePicPublicId
        );
      } catch (err) {
        console.log(
          "Cloudinary delete failed:",
          err.message
        );
      }
    }

    // --------------------------
    // Update Database
    // --------------------------
    const updatedPandit = await prisma.pandit.update({
      where: {
        id: payload.id,
      },
      data: {
        profilePic,
        profilePicPublicId,
      },
      select: {
        id: true,
        profilePic: true,
        profilePicPublicId: true,
      },
    });

    console.log(
      "Avatar Updated:",
      updatedPandit.profilePic
    );

    return NextResponse.json({
      success: true,
      profilePic: updatedPandit.profilePic,
      profilePicPublicId:
        updatedPandit.profilePicPublicId,
    });
  } catch (err) {
    console.error(
      "Avatar Upload Error:",
      err
    );

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}