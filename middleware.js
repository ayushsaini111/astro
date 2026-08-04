// frontend/middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // ✅ Always public
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/pandit/login") ||
          pathname.startsWith("/api/") ||
          pathname.startsWith("/auth/") ||
          pathname.startsWith("/backend/") ||
          pathname === "/"
        ) {
          return true;
        }

        // Pandit-only
        if (pathname.startsWith("/pandit")) {
          return token?.role === "pandit";
        }

        // User-only
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|mp4|woff2?|ttf|otf)$).*)",
  ],
};