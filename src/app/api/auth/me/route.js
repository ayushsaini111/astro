import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // 1. Cookie (OTP users)
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          profilePic: true,
          email: true,
        },
      });

      if (user) {
        return Response.json({
          id: user.id,
          username: user.username,
          profilePic: user.profilePic,
          email: user.email,
          role: "user",
          loginType: "otp",
        });
      }
    }

    // 2. NextAuth session (Google users)
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return Response.json({
        id: session.user.id,
        username: session.user.username,
        profilePic: session.user.profilePic ?? session.user.image,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role ?? "user",
        loginType: "google",
      });
    }

    return Response.json(null);
  } catch {
    return Response.json(null);
  }
}
