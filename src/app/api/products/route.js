// src/app/api/products/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "All";
    const search   = searchParams.get("search")   || "";
    const sort     = searchParams.get("sort")     || "popularity";
    const tags     = searchParams.get("tags")     || ""; // comma separated
    const page     = parseInt(searchParams.get("page")  || "1");
    const limit    = parseInt(searchParams.get("limit") || "20");
    const skip     = (page - 1) * limit;

    // ── Build where clause ──────────────────────────────────────────────
    const where = { isActive: true };

    if (category && category !== "All") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title:            { contains: search, mode: "insensitive" } },
        { description:      { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { category:         { contains: search, mode: "insensitive" } },
        { tags:             { has: search.toLowerCase() } },
      ];
    }

    // Filter by tags (e.g. "popular,bestSeller")
    if (tags) {
      const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList };
      }
    }

    // ── Build orderBy ───────────────────────────────────────────────────
    let orderBy = {};
    switch (sort) {
      case "price-low":   orderBy = { price:  "asc"  }; break;
      case "price-high":  orderBy = { price:  "desc" }; break;
      case "rating":      orderBy = { rating: "desc" }; break;
      case "newest":      orderBy = { createdAt: "desc" }; break;
      default:            orderBy = { reviews: "desc" }; // popularity
    }

    // ── Query ───────────────────────────────────────────────────────────
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          testimonials: {
            orderBy: { date: "desc" },
            take: 5,
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // ── Fetch all unique tags for filter UI ─────────────────────────────
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { tags: true },
    });

    const allTags = [...new Set(allProducts.flatMap(p => p.tags))].sort();

    // ── Categories with counts ──────────────────────────────────────────
    const categoryCounts = await prisma.product.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { category: true },
    });

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        allTags,
        categoryCounts,
      },
    });
  } catch (error) {
    console.error("❌ Products API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Add new product (for future CMS)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title, shortDescription, description, longDescription,
      category, price, originalPrice,
      image, images, inStock,
      benefits, tags, specifications,
    } = body;

    if (!title || !category || !price) {
      return NextResponse.json(
        { success: false, error: "title, category, price are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        title,
        shortDescription,
        description,
        longDescription,
        category,
        price:         parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image,
        images:         images        || [],
        inStock:        inStock ?? true,
        isActive:       true,
        benefits:       benefits      || [],
        tags:           tags          || [],
        specifications: specifications || {},
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// UPDATE — PUT /api/products
// ============================================================================
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      title, shortDescription, description, longDescription,
      category, price, originalPrice,
      image, images, inStock, isActive,
      benefits, tags, specifications,
      rating, reviews,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!title || !category || price === undefined) {
      return NextResponse.json(
        { success: false, error: "title, category, price are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        title,
        shortDescription,
        description,
        longDescription,
        category,
        price:         parseFloat(price),
        originalPrice: originalPrice !== undefined && originalPrice !== null && originalPrice !== ""
          ? parseFloat(originalPrice)
          : null,
        image,
        images:         images        || [],
        inStock:        inStock ?? true,
        isActive:       isActive ?? true,
        benefits:       benefits      || [],
        tags:           tags          || [],
        specifications: specifications || {},
        ...(rating !== undefined  && { rating: parseFloat(rating) }),
        ...(reviews !== undefined && { reviews: parseInt(reviews) }),
      },
      include: {
        testimonials: { orderBy: { date: "desc" }, take: 5 },
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("❌ Update product error:", error);
    if (error.code === "P2025") {
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

// ============================================================================
// DELETE — DELETE /api/products?id=xxx
// ============================================================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete product error:", error);
    if (error.code === "P2025") {
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