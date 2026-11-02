import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBucket } from "@/lib/gcsClient";

export async function GET(req, { params }) {
  try {
    const { callId } = await params;

    const rec = await prisma.recording.findUnique({ where: { callId } });
    if (!rec || rec.status !== "STOPPED" || !rec.fileList?.length) {
      return NextResponse.json({ success: false, error: "Recording not available" }, { status: 404 });
    }

    const file = getBucket().file(rec.fileList[0]);
    const [exists] = await file.exists();
    if (!exists) {
      console.error("❌ file missing in bucket:", rec.fileList[0]);
      return NextResponse.json(
        { success: false, error: `File not found: ${rec.fileList[0]}` },
        { status: 404 }
      );
    }

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
      responseType: "audio/mp4",
      responseDisposition: "inline",
    });

    return NextResponse.json({ success: true, url });
  } catch (e) {
    console.error("❌ signed url error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}