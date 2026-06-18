// app/api/pandit/create-test/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This test-only endpoint is disabled in production." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    name,
    username,
    password,
    email,
    phone,
    dob,
    about,
    speciality,
    languages,
    profilePic,
    isAvailable,
  } = body ?? {};

  // ✅ Validation
  if (!name || !username || !password) {
    return NextResponse.json(
      { error: "name, username, and password are required" },
      { status: 400 }
    );
  }

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  // ✅ Validate arrays
  const specialityArray = Array.isArray(speciality)
    ? speciality.filter(Boolean)
    : [];

  const languagesArray = Array.isArray(languages)
    ? languages.filter(Boolean)
    : [];

  if (specialityArray.length === 0) {
    return NextResponse.json(
      { error: "At least one speciality is required" },
      { status: 400 }
    );
  }

  if (languagesArray.length === 0) {
    return NextResponse.json(
      { error: "At least one language is required" },
      { status: 400 }
    );
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    // ✅ Check if username exists
    const existing = await prisma.pandit.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const pandit = await prisma.pandit.create({
      data: {
        name,
        username,
        password: hashed,
        email: email || null,
        phone: phone || null,
        dob: dob ? new Date(dob) : null,
        about: about || null,
        profilePic: profilePic || null,
        speciality: specialityArray,
        languages: languagesArray,
        isAvailable: isAvailable !== false,
      },
    });

    return NextResponse.json({
      success: true,
      pandit: {
        id: pandit.id,
        username: pandit.username,
        name: pandit.name,
        email: pandit.email,
        phone: pandit.phone,
        dob: pandit.dob,
        about: pandit.about,
        profilePic: pandit.profilePic,
        speciality: pandit.speciality,
        languages: pandit.languages,
        isAvailable: pandit.isAvailable,
      },
      note: "Use the plain password you sent to log in at /pandit/login — only the hash is stored.",
    });
  } catch (err) {
    console.error("❌ create-test pandit error:", err.message);
    return NextResponse.json(
      { error: "Failed to create test pandit", detail: err.message },
      { status: 500 }
    );
  }
}