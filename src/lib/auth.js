import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  providers: [
    // ── USER: Google ────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ── USER: Phone OTP ─────────────────────────────────────────
    CredentialsProvider({
      id: "otp-credentials",
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

        await prisma.oTPVerification.update({
          where: { id: record.id },
          data: { expiresAt: new Date(0) },
        });

        return {
          id: record.user.id,
          phone: record.user.phone,
          role: "user",
        };
      },
    }),

    // ── PANDIT: login only — account is created on the other site ──
    // This provider NEVER creates or modifies a Pandit row. It only
    // reads the existing row (made elsewhere) and checks the password.
    CredentialsProvider({
      id: "pandit-credentials",
      name: "Pandit Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { username, password } = credentials ?? {};
        if (!username || !password) return null;

        const pandit = await prisma.pandit.findUnique({
          where: { username },
        });
        if (!pandit?.password) return null;

        // Password may be bcrypt-hashed or plain text depending on how
        // the other site stored it. Try bcrypt first; if the stored
        // value isn't a valid bcrypt hash, bcrypt.compare just returns
        // false (it won't throw), so fall back to a direct string check.
        let valid = false;
        try {
          valid = await bcrypt.compare(password, pandit.password);
        } catch {
          valid = false;
        }
        if (!valid && pandit.password === password) {
          valid = true;
        }
        if (!valid) return null;

        return {
          id: pandit.id,
          username: pandit.username,
          role: "pandit",
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";

        if (user.role === "pandit") {
          token.username = user.username ?? null;
          token.phone = null;
          token.email = null;
        } else {
          token.phone = user.phone ?? null;
          token.email = user.email ?? null;
        }
      }

      if (trigger === "update" && token.role !== "pandit") {
        if (token.phone && !token.email) {
          const dbUser = await prisma.user.findUnique({ where: { phone: token.phone } });
          token.username = dbUser?.username ?? null;
        }
        if (token.email) {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
          token.username = dbUser?.username ?? null;
        }
      }

      return token;
    },

    // Google sign-in is User-only — no Pandit logic here at all.
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { profilePic: user.image ?? null },
          create: {
            email: user.email,
            username: null,
            isVerified: true,
            profilePic: user.image ?? null,
          },
        });
        return true;
      } catch (err) {
        console.error("❌ signIn error:", err.message);
        return false;
      }
    },

    async session({ session, token }) {
      session.user.id = token.id ?? null;
      session.user.role = token.role ?? "user";

      // ── Pandit session — read-only, no writes ────────────────
      if (token.role === "pandit") {
        const pandit = await prisma.pandit.findUnique({
          where: { id: token.id },
        });
        session.user.username = pandit?.username ?? token.username ?? null;
        session.user.name = pandit?.name ?? null;
        session.user.profilePic = pandit?.profilePic ?? null;
        session.user.speciality = pandit?.speciality ?? [];
        session.user.ratePerMin = pandit?.ratePerMin ?? null;
        session.user.isAvailable = pandit?.isAvailable ?? null;
        return session;
      }

      // ── User session (Google) ───────────────────────────────
      if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        session.user.id = dbUser?.id ?? token.id;
        session.user.username = dbUser?.username ?? null;
        session.user.dob = dbUser?.dob ?? null;
        session.user.profilePic = dbUser?.profilePic ?? null;
        session.user.phone = dbUser?.phone ?? null;
        session.user.gender = dbUser?.gender ?? null;
        session.user.address = dbUser?.address ?? null;
      }

      // ── User session (Phone OTP) ─────────────────────────────
      if (token.phone && !token.email) {
        const dbUser = await prisma.user.findUnique({ where: { phone: token.phone } });
        session.user.id = dbUser?.id ?? token.id;
        session.user.username = dbUser?.username ?? null;
        session.user.phone = dbUser?.phone ?? token.phone;
        session.user.profilePic = dbUser?.profilePic ?? null;
        session.user.dob = dbUser?.dob ?? null;
        session.user.gender = dbUser?.gender ?? null;
        session.user.address = dbUser?.address ?? null;
        session.user.createdAt = dbUser?.createdAt ?? null;
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