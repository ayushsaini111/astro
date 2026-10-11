import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { endCallAndBill } from "@/lib/callBilling";

export async function POST(req) {
  try {
    let userId = req.headers.get("x-user-id");
    if (!userId) userId = (await cookies()).get("userId")?.value;
    if (!userId) userId = (await getServerSession(authOptions))?.user?.id;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { callId, clientDuration } = await req.json();
    if (!callId) return Response.json({ error: "Missing callId" }, { status: 400 });

    const result = await endCallAndBill({ callId, endedBy: userId, clientDuration });
    return Response.json(result);
  } catch (err) {
    console.error("❌ End call error:", err.message);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}