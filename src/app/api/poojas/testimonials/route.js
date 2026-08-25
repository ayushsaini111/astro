// src/app/api/poojas/testimonials/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const poojaId = parseInt(searchParams.get("poojaId"));

    if (!poojaId) {
      return NextResponse.json(
        { success: false, error: "poojaId is required" },
        { status: 400 }
      );
    }

    const testimonials = await prisma.pooja_testimonials.findMany({
      where: { pooja_id: poojaId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { pooja_id, name, location, rating, text } = body;

    if (!pooja_id || !name || !text) {
      return NextResponse.json(
        { success: false, error: "pooja_id, name, and text are required" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.pooja_testimonials.create({
      data: {
        pooja_id: parseInt(pooja_id),
        name,
        location: location || null,
        rating: rating ? parseInt(rating) : 5,
        text,
      },
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    if (error.code === "P2003") {
      return NextResponse.json(
        { success: false, error: "Pooja not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, location, rating, text } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Testimonial id is required" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.pooja_testimonials.update({
      where: { id: parseInt(id) },
      data: {
        name,
        location: location || null,
        rating: rating ? parseInt(rating) : 5,
        text,
      },
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    await prisma.pooja_testimonials.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Testimonial deleted" });
  } catch (error) {
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