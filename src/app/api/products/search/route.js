// backend/src/app/api/products/search/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ success: true, results: [] });
  }

  try {
    const results = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      select: {
        id: true,
        title: true,
        image: true,
        price: true,
        originalPrice: true,
        category: true,
        rating: true,
      },
      take: 6,
      orderBy: { reviews: "desc" },
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ success: false, results: [] }, { status: 500 });
  }
}