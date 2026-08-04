// app/api/pandits/route.js  (in the OLD project on port 3001)
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pandits = await prisma.pandit.findMany({
      where: { isAvailable: true },
      select: {
        id: true,
        name: true,
        username: true,
        speciality: true,
        languages: true,
        profilePic: true,
        about: true,
        isAvailable: true,
      },
    });
    return NextResponse.json(pandits);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}