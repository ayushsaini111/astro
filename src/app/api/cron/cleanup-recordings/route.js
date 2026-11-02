import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.recording.updateMany({
    where: { startedAt: { lt: thirtyDaysAgo }, status: "STOPPED" },
    data: { status: "EXPIRED", fileList: [] },
  });

  console.log(`🧹 [cleanup-recordings] expired ${result.count} recordings older than 30 days`);
  return NextResponse.json({ expired: result.count });
}