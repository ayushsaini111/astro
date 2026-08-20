import { prisma } from "@/lib/prisma.js";

export async function POST(request) {
  console.log("🔥 sync-user endpoint hit!");

  try {
    const body = await request.json();
    const { email, name, image } = body;

    if (!email) {
      return Response.json(
        { success: false, error: "Email required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        name: name || undefined,
        image: image || undefined,
        provider: "GOOGLE",
        isVerified: true,
        updatedAt: new Date(),
      },
      create: {
        email: email.toLowerCase().trim(),
        name: name || "",
        image: image || null,
        provider: "GOOGLE",
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    console.log("✅ User synced:", user.id);

    return Response.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("💥 sync-user error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}