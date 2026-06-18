// app/api/pandit/profile/route.js
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { deleteImageFromCloudinary } from "@/lib/cloudinary";
import bcrypt from "bcryptjs";

// ─── GET Profile ─────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);

  console.log("🔍 GET /api/pandit/profile — session:", session?.user?.role);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pandit = await prisma.pandit.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        dob: true,
        about: true,
        profilePic: true,
        profilePicPublicId: true,
        speciality: true,
        languages: true,
        ratePerMin: true,
        isAvailable: true,
        startTime: true,
        endTime: true,
        breakTime: true,
        workingDays: true,
        notificationsConsultationRequests: true,
        notificationsMessages: true,
        notificationsReminders: true,
        notificationsPromotions: true,
        createdAt: true,
      },
    });

    if (!pandit) {
      return NextResponse.json({ error: "Pandit not found" }, { status: 404 });
    }

    console.log("✅ Profile loaded for:", pandit.username);
    return NextResponse.json(pandit);
  } catch (error) {
    console.error("❌ GET /api/pandit/profile error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PUT / Update Profile ─────────────────────────────────────────────────────
export async function PUT(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    name,
    email,
    phone,
    dob,
    about,
    password,
    speciality,
    languages,
    profilePic,
    isAvailable,
  } = body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!name?.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  if (!email?.trim())
    return NextResponse.json({ error: "Email is required" }, { status: 400 });

  if (!phone?.trim())
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 }
    );

  const specialityArray = Array.isArray(speciality)
    ? speciality.filter(Boolean)
    : [];

  const languagesArray = Array.isArray(languages)
    ? languages.filter(Boolean)
    : [];

  if (specialityArray.length === 0)
    return NextResponse.json(
      { error: "At least one speciality is required" },
      { status: 400 }
    );

  if (languagesArray.length === 0)
    return NextResponse.json(
      { error: "At least one language is required" },
      { status: 400 }
    );

  try {
    const existingPandit = await prisma.pandit.findUnique({
      where: { id: session.user.id },
      select: { profilePic: true },
    });

    if (!existingPandit) {
      return NextResponse.json({ error: "Pandit not found" }, { status: 404 });
    }

    // ── Delete old Cloudinary image if new one is coming ─────────────────────
    const oldProfilePic = existingPandit.profilePic;
    const isNewImage =
      profilePic &&
      profilePic !== oldProfilePic &&
      profilePic.includes("cloudinary.com");

    if (isNewImage && oldProfilePic) {
      console.log("🔄 Deleting old image from Cloudinary...");
      await deleteImageFromCloudinary(oldProfilePic);
      console.log("✅ Old image deleted");
    }

    if (profilePic === null && oldProfilePic) {
      console.log("🗑️ User removed image — deleting from Cloudinary...");
      await deleteImageFromCloudinary(oldProfilePic);
    }

    // ── Hash password only if provided ───────────────────────────────────────
    const passwordUpdate =
      password && password.trim().length > 0
        ? { password: await bcrypt.hash(password.trim(), 10) }
        : {};

    // ── Update DB ────────────────────────────────────────────────────────────
    const updatedPandit = await prisma.pandit.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dob: dob ? new Date(dob) : null,
        about: about?.trim() || null,
        speciality: specialityArray,
        languages: languagesArray,
        isAvailable: isAvailable !== false,
        ...(profilePic !== undefined && { profilePic: profilePic || null }),
        ...passwordUpdate,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        dob: true,
        about: true,
        profilePic: true,
        speciality: true,
        languages: true,
        isAvailable: true,
      },
    });

    console.log("✅ Profile updated for:", updatedPandit.username);
    return NextResponse.json({ success: true, pandit: updatedPandit });
  } catch (err) {
    console.error("❌ PUT /api/pandit/profile error:", err.message);
    return NextResponse.json(
      { error: "Failed to update profile", detail: err.message },
      { status: 500 }
    );
  }
}