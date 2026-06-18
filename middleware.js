// middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    console.log("🔒 Middleware check:", req.nextUrl.pathname, req.nextauth.token?.role);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // ✅ Public routes - allow everyone
        if (pathname.startsWith('/pandit/login') || 
            pathname.startsWith('/login') ||
            pathname.startsWith('/api/auth') ||
            pathname === '/') {
          return true;
        }

        // ✅ Pandit protected routes
        if (pathname.startsWith('/pandit')) {
          return token?.role === 'pandit';
        }

        // ✅ User protected routes
        if (pathname.startsWith('/dashboard') || 
            pathname.startsWith('/profile')) {
          return token?.role === 'user';
        }

        // ✅ Allow other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/pandit/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    // Don't run middleware on these
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};