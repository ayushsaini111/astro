import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const PANDIT_EMAILS = ["ayushsaini8008@gmail.com", "abhijeetdwivedi627@gmail.com"];

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const { phone, token } = credentials ?? {};
        if (!phone || !token) return null;

        const record = await prisma.oTPVerification.findFirst({
          where: {
            identifier: phone,
            otp: token,
            verified: true,
            expiresAt: { gt: new Date() },
          },
          include: { user: true },
        });

        if (!record?.user) return null;

        // Invalidate token immediately
        await prisma.oTPVerification.update({
          where: { id: record.id },
          data: { expiresAt: new Date(0) },
        });

        return {
          id:       record.user.id,
          phone:    record.user.phone,
          username: record.user.username ?? null,
          role:     "user",
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.phone    = user.phone    ?? null;
        token.username = user.username ?? null;
        token.role     = user.role     ?? "user";
        token.email    = user.email    ?? null;
      }
      return token;
    },

    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      try {
        const isPandit = PANDIT_EMAILS.includes(user.email);
        if (isPandit) {
          await prisma.pandit.upsert({
            where:  { email: user.email },
            update: { name: user.name ?? "Pandit", profilePic: user.image ?? null },
            create: { email: user.email, name: user.name ?? "Pandit", profilePic: user.image ?? null, speciality: "Vedic Astrology" },
          });
        } else {
          await prisma.user.upsert({
            where:  { email: user.email },
            update: { profilePic: user.image ?? null },
            create: { email: user.email, username: null, isVerified: true, profilePic: user.image ?? null },
          });
        }
        return true;
      } catch (err) {
        console.error("❌ signIn error:", err.message);
        return false;
      }
    },

    async session({ session, token }) {
      session.user.id       = token.id       ?? null;
      session.user.phone    = token.phone    ?? null;
      session.user.username = token.username ?? null;
      session.user.role     = token.role     ?? "user";

      // Google user
      if (token.email) {
        const isPandit = PANDIT_EMAILS.includes(token.email);
        if (isPandit) {
          const pandit = await prisma.pandit.findUnique({ where: { email: token.email } });
          session.user.role     = "pandit";
          session.user.panditId = pandit?.id ?? null;
        } else {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
          session.user.id         = dbUser?.id         ?? token.id;
          session.user.username   = dbUser?.username   ?? token.username;
          session.user.dob        = dbUser?.dob        ?? null;
          session.user.profilePic = dbUser?.profilePic ?? null;
        }
      }

      // OTP user
      if (token.phone && !token.email) {
        const dbUser = await prisma.user.findUnique({ where: { phone: token.phone } });
        session.user.id         = dbUser?.id         ?? token.id;
        session.user.username   = dbUser?.username   ?? token.username;
        session.user.phone      = dbUser?.phone      ?? token.phone;
        session.user.profilePic = dbUser?.profilePic ?? null;
      }

      return session;
    },
  },

  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};