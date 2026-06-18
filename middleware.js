import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/pandit") && pathname !== "/pandit/login") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    console.log("MIDDLEWARE DEBUG — pathname:", pathname, "token:", token);

    if (!token || token.role !== "pandit") {
      const url = new URL("/pandit/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pandit/:path*"],
};