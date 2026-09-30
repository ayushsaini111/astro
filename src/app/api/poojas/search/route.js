// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(request) {
//   const { searchParams } = new URL(request.url);
//   const query = searchParams.get("query");

//   if (!query) return NextResponse.json([]);

//   try {
//     const poojas = await prisma.poojas.findMany({
//       where: {
//         OR: [
//           { title: { contains: query, mode: "insensitive" } },
//           { short_description: { contains: query, mode: "insensitive" } },
//           { description: { contains: query, mode: "insensitive" } },
//         ],
//       },
//       take: 5,
//     });

//     return NextResponse.json(poojas);
//   } catch (error) {
//     console.error("Error searching poojas:", error);
//     return NextResponse.json([], { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const category = searchParams.get("category"); // optional, backward-compatible

  if (!query) return NextResponse.json([]);

  try {
    const poojas = await prisma.poojas.findMany({
      where: {
        AND: [
          category ? { category } : {},
          {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { short_description: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              // ✅ additive — also matches inside rich content, same response shape
              { pooja_content: { about_content: { contains: query, mode: "insensitive" } } },
              { pooja_content: { live_content: { contains: query, mode: "insensitive" } } },
              { pooja_content: { cultural_story: { contains: query, mode: "insensitive" } } },
            ],
          },
        ],
      },
      take: 6,
    });

    return NextResponse.json(poojas);
  } catch (error) {
    console.error("Error searching poojas:", error);
    return NextResponse.json([], { status: 500 });
  }
}