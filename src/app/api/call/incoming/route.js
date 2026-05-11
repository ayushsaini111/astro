import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // For pandit — get INITIATED calls
  const panditId = searchParams.get("panditId");
  if (panditId) {
    const calls = await prisma.call.findMany({
      where: { panditId, status: "INITIATED" },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { username: true, dob: true, phone: true },
        },
      },
    });
    return Response.json({ calls });
  }

  // For user — get RINGING calls
  const userId = searchParams.get("userId");
  if (userId) {
    const call = await prisma.call.findFirst({
      where: { userId, status: "RINGING" },
      orderBy: { createdAt: "desc" },
      include: {
        pandit: {
          select: { name: true, speciality: true, profilePic: true },
        },
      },
    });
    return Response.json({ call: call ?? null });
  }

  return Response.json({ call: null });
}