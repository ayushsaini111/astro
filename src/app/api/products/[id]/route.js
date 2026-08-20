// src/app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    // ✅ Await params in Next.js 13+ App Router
    const { id } = await params;

    // ✅ Add validation
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching product with ID:", id); // Debug log

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        testimonials: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}