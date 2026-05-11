import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const PANDIT_EMAILS = ["ayushsaini8008@gmail.com","abhijeetdwivedi627@gmail.com"];

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      
      try {
        const isPandit = PANDIT_EMAILS.includes(user.email);

        if (isPandit) {
          await prisma.pandit.upsert({
            where: { email: user.email },
            update: {
              name: user.name ?? "Pandit",
              profilePic: user.image ?? null,
            },
            create: {
              email: user.email,
              name: user.name ?? "Pandit",
              profilePic: user.image ?? null,
              speciality: "Vedic Astrology",
            },
          });
   } else {
  await prisma.user.upsert({
    where: { email: user.email },
    update: {
      profilePic: user.image ?? null, // ✅ update pic on every login
    },
    create: {
      email: user.email,
      username: null,
      isVerified: true,
      profilePic: user.image ?? null, // ✅ save on first login
    },
  });
}

        return true;
      } catch (err) {
        console.error("❌ signIn error:", err.message);
        return false;
      }
    },

    async session({ session }) {
      const isPandit = PANDIT_EMAILS.includes(session.user.email);

      if (isPandit) {
        const pandit = await prisma.pandit.findUnique({
          where: { email: session.user.email },
        });

        session.user.role = "pandit";
        session.user.panditId = pandit?.id ?? null;
      } else {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        session.user.role = "user";
        session.user.id = user?.id ?? null;        // ✅ IMPORTANT
        session.user.username = user?.username ?? null;
        session.user.dob = user?.dob ?? null;
        session.user.profilePic = user?.profilePic ?? null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};