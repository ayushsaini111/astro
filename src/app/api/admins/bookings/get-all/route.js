import { prisma } from "@/lib/prisma";

export async function GET(request) {
  console.log("🔥 Get all bookings endpoint hit!");

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const poojaType = searchParams.get("type");

    // console.log("📋 Query params:", { userId, status, poojaType });

    // Build filter
    let whereClause = {};

    if (userId && userId !== "undefined" && userId !== "null") {
      whereClause.userId = userId;
      console.log("🔍 Filtering by userId:", userId);
    } else {
      // console.log("📌 Fetching ALL bookings (no user filter)");
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
      console.log("🔍 Filtering by status:", status);
    }

    if (poojaType && poojaType !== "ALL") {
      whereClause.poojaType = poojaType;
      // console.log("🔍 Filtering by poojaType:", poojaType);
    }

    console.log("📊 Where clause:", JSON.stringify(whereClause));

    // Fetch bookings with relations
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        reminders: {
          orderBy: { scheduledTime: "asc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${bookings.length} bookings`);
    if (bookings.length > 0) {
      // console.log("📦 Sample booking:", JSON.stringify(bookings[0], null, 2));
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: bookings,
        count: bookings.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Get bookings error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}