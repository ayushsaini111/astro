// backend/src/app/api/user/delete/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return { id: userId };
}

export async function DELETE(request) {
  try {
    const user = getUserFromHeaders(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}