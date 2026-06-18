// app/api/pandit/profile/expertise/route.js
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { speciality, languages } = body;

  try {
    // Build update object dynamically
    const updateData = {};

    if (speciality !== undefined) {
      if (!Array.isArray(speciality)) {
        return NextResponse.json(
          { error: "Speciality must be an array" },
          { status: 400 }
        );
      }
      updateData.speciality = speciality.filter(Boolean);
    }

    if (languages !== undefined) {
      if (!Array.isArray(languages)) {
        return NextResponse.json(
          { error: "Languages must be an array" },
          { status: 400 }
        );
      }
      updateData.languages = languages.filter(Boolean);
    }

    // Validate at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update database
    const updated = await prisma.pandit.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        speciality: true,
        languages: true,
      },
    });

    console.log("✅ Expertise/Languages updated for:", session.user.id, updateData);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("❌ Expertise/Languages update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}