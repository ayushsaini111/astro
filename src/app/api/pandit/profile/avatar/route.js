// app/api/pandit/profile/avatar/route.js
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json(); // ✅ Accept JSON, not formData
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { profilePic, profilePicPublicId } = body;

  if (!profilePic || !profilePicPublicId) {
    return NextResponse.json(
      { error: "profilePic and profilePicPublicId required" },
      { status: 400 }
    );
  }

  try {
    // Get current pandit to delete old image
    const existingPandit = await prisma.pandit.findUnique({
      where: { id: session.user.id },
      select: { profilePicPublicId: true },
    });

    // Delete old image if exists
    if (existingPandit?.profilePicPublicId) {
      console.log("🗑️ Deleting old image:", existingPandit.profilePicPublicId);
      await deleteFromCloudinary(existingPandit.profilePicPublicId);
    }

    // Update database with new image
    const updated = await prisma.pandit.update({
      where: { id: session.user.id },
      data: {
        profilePic,
        profilePicPublicId,
      },
      select: {
        profilePic: true,
      },
    });

    console.log("✅ Avatar updated for:", session.user.id);
    return NextResponse.json({
      success: true,
      profilePic: updated.profilePic,
    });
  } catch (error) {
    console.error("❌ Avatar update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update avatar" },
      { status: 500 }
    );
  }
}