import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId, problemCategory, expertiseType, problemDescription, matchedCount } =
      await request.json();

    if (!problemCategory || !expertiseType) {
      return NextResponse.json(
        { error: "problemCategory and expertiseType are required" },
        { status: 400 }
      );
    }

    const record = await prisma.expertSearchRequest.create({
      data: {
        userId: userId || null,
        problemCategory,
        expertiseType,
        problemDescription: problemDescription || null,
        matchedCount: matchedCount || 0,
      },
    });

    return NextResponse.json({ id: record.id });
  } catch (err) {
    console.error("💥 expert-search POST error:", err);
    return NextResponse.json({ error: "Failed to save search request" }, { status: 500 });
  }
}