// src/app/api/products/categories/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [categories, counts] = await Promise.all([
      prisma.productCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.groupBy({
        by: ["category"],
        where: { isActive: true },
        _count: { category: true },
      }),
    ]);

    const countMap = Object.fromEntries(
      counts.map(c => [c.category, c._count.category])
    );

    const result = categories.map(cat => ({
      ...cat,
      productCount: cat.name === "All"
        ? counts.reduce((sum, c) => sum + c._count.category, 0)
        : countMap[cat.name] || 0,
    }));

    return NextResponse.json({ success: true, categories: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// CREATE — POST /api/products/categories
// ============================================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, slug, icon, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "name and slug are required" },
        { status: 400 }
      );
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        slug,
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Category name or slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// UPDATE — PUT /api/products/categories
// ============================================================================
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, slug, icon, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE — DELETE /api/products/categories?id=xxx
// ============================================================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    await prisma.productCategory.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}