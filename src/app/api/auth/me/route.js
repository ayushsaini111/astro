import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return Response.json({
        id:         session.user.id,
        username:   session.user.username,
        profilePic: session.user.profilePic ?? session.user.image ?? null,
        email:      session.user.email      ?? null,
        phone:      session.user.phone      ?? null,
        name:       session.user.name       ?? null,
        image:      session.user.image      ?? null,
        role:       session.user.role       ?? "user",
      });
    }
    return Response.json(null);
  } catch {
    return Response.json(null);
  }
}