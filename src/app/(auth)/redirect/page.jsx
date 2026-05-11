import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  if (session.user.role === "pandit") {
    redirect("/pandit");
  }

  // ✅ already comes from session callback
  if (!session.user.username || !session.user.dob) {
    redirect("/username");
  }

  redirect("/home");
}