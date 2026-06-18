// app/api/pandit/profile/personal/route.js
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

  const { name, email, phone, about } = body;

  try {
    // Validation
    const allowedFields = { name, email, phone, about };
    const updateData = {};

    Object.entries(allowedFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === "string" && !value.trim()) {
          throw new Error(`${key} cannot be empty`);
        }
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.pandit.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        name: true,
        email: true,
        phone: true,
        about: true,
      },
    });

    console.log("✅ Personal info updated for:", session.user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("❌ Personal info update error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}