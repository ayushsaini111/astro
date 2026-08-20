// src/app/api/products/testimonials/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET testimonials for a specific product
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "productId is required" },
        { status: 400 }
      );
    }

    const testimonials = await prisma.productTestimonial.findMany({
      where: { productId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// CREATE — POST /api/products/testimonials
export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, name, location, rating, text } = body;

    if (!productId || !name || !text) {
      return NextResponse.json(
        { success: false, error: "productId, name, and text are required" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.productTestimonial.create({
      data: {
        productId,
        name,
        location: location || null,
        rating: rating ? parseInt(rating) : 5,
        text,
      },
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    console.error("❌ Create testimonial error:", error);
    if (error.code === "P2003") {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE — PUT /api/products/testimonials
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, location, rating, text } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Testimonial ID is required" },
        { status: 400 }
      );
    }

    if (!name || !text) {
      return NextResponse.json(
        { success: false, error: "name and text are required" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.productTestimonial.update({
      where: { id },
      data: {
        name,
        location: location || null,
        rating: rating ? parseInt(rating) : 5,
        text,
      },
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    console.error("❌ Update testimonial error:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE — DELETE /api/products/testimonials?id=xxx
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Testimonial ID is required" },
        { status: 400 }
      );
    }

    await prisma.productTestimonial.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Testimonial deleted" });
  } catch (error) {
    console.error("❌ Delete testimonial error:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Testimonial not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}