import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) return NextResponse.json([]);

  try {
    const poojas = await prisma.poojas.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { short_description: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    return NextResponse.json(poojas);
  } catch (error) {
    console.error("Error searching poojas:", error);
    return NextResponse.json([], { status: 500 });
  }
}