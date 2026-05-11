import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const { callId } = await req.json();

  await prisma.call.update({
    where: { id: callId },
    data: { status: "FAILED" },
  });

  return Response.json({ success: true });
}