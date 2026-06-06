// app/api/user/delete/route.js

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // ✅ Fetch user info before deletion (to preserve username in calls)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, phone: true, email: true },
  });

  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  // ✅ PRESERVE call records — detach user from calls but keep history
  await prisma.call.updateMany({
    where: { userId },
    data: {
      userId: null,                          // detach the FK
      deletedUsername: user.username ?? "Deleted User",  // store name for pandit history
    },
  });

  // ✅ Also detach from CallBilling/CallEvent — these belong to Call, not User, so they stay
  // (No changes needed — they FK to callId, not userId)

  // ✅ Delete only truly user-owned data
  await prisma.freeCallUsage.deleteMany({ where: { userId } });
  await prisma.userPlan.deleteMany({ where: { userId } });
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.device.deleteMany({ where: { userId } });
  await prisma.oTPVerification.deleteMany({ where: { userId } });
  await prisma.wallet.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  const response = Response.json({ success: true });
  response.headers.append("Set-Cookie", "userId=; Max-Age=0; Path=/; HttpOnly");
  response.headers.append("Set-Cookie", "next-auth.session-token=; Max-Age=0; Path=/; HttpOnly");
  response.headers.append("Set-Cookie", "__Secure-next-auth.session-token=; Max-Age=0; Path=/; HttpOnly");
  return response;
}