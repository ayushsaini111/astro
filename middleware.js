// frontend/middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    console.log("🔒 Middleware check:", req.nextUrl.pathname, req.nextauth.token?.role);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (pathname.startsWith('/pandit/login') || 
            pathname.startsWith('/login') ||
            pathname.startsWith('/api/auth') ||
            pathname.startsWith('/backend') ||  // ✅ ADD THIS LINE
            pathname === '/') {
          return true;
        }

        if (pathname.startsWith('/pandit')) {
          return token?.role === 'pandit';
        }

        if (pathname.startsWith('/dashboard') || 
            pathname.startsWith('/profile')) {
          return token?.role === 'user';
        }

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
    '/((?!api|backend|_next/static|_next/image|favicon.ico).*)',  // ✅ ADD backend HERE
  ]
};