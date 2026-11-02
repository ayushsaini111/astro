import { NextResponse } from "next/server";
import { getSegmentCounts } from "@/lib/notifications/segments";

export async function GET() {
  try {
    const segments = await getSegmentCounts();
    return NextResponse.json({ success: true, segments });
  } catch (error) {
    console.error("❌ Segment counts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}