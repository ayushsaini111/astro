import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/poojas/:id/content
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const poojaId = parseInt(id);

    if (!poojaId) {
      return NextResponse.json(
        { success: false, error: "Invalid pooja id" },
        { status: 400 }
      );
    }

    const content = await prisma.pooja_content.findUnique({
      where: { pooja_id: poojaId },
    });

    return NextResponse.json({ success: true, content: content || null });
  } catch (error) {
    console.error("Get pooja content error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/poojas/:id/content  (upsert — create if missing, update if exists)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const poojaId = parseInt(id);
    const body = await request.json();

    if (!poojaId) {
      return NextResponse.json(
        { success: false, error: "Invalid pooja id" },
        { status: 400 }
      );
    }

    const data = {
      hero_subtitle: body.hero_subtitle || null,
      hero_access: body.hero_access || null,
      hero_benefits: body.hero_benefits || [],
      about_title: body.about_title || null,
      about_content: body.about_content || null,
      live_title: body.live_title || null,
      live_content: body.live_content || null,
      how_it_works: body.how_it_works || [],
      process_intro: body.process_intro || null,
      process_steps: body.process_steps || [],
      preparation_note: body.preparation_note || null,
      preparation_required: body.preparation_required || [],
      preparation_optional: body.preparation_optional || [],
      cultural_title: body.cultural_title || null,
      cultural_story: body.cultural_story || null,
      cultural_chapters: body.cultural_chapters || [],
      cultural_closing: body.cultural_closing || null,
      faqs: body.faqs || [],
      closing_title: body.closing_title || null,
      closing_description: body.closing_description || null,
      closing_tags: body.closing_tags || [],
    };

    const content = await prisma.pooja_content.upsert({
      where: { pooja_id: poojaId },
      update: data,
      create: { pooja_id: poojaId, ...data },
    });

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("Save pooja content error:", error);
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