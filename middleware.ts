import NextAuth from "next-auth";
import authConfig, { type EdgeUserRole } from "./auth.config";
import { NextResponse } from "next/server";

// Use lightweight config for Edge Middleware
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role as EdgeUserRole | undefined;

  const isPublicRoute = nextUrl.pathname === "/login";
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isWebhookRoute = nextUrl.pathname.startsWith("/api/webhooks");
  
  // Allow API auth, webhooks, and public routes
  if (isApiAuthRoute || isPublicRoute || isWebhookRoute) {
    return NextResponse.next();
  }

  // Redirect to login if not logged in and not a public route
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Route-specific role protection
  if (isLoggedIn) {
    // 1. Matrix & Settings (Admin Only)
    if (
      nextUrl.pathname.startsWith("/matrix") || 
      nextUrl.pathname.startsWith("/settings")
    ) {
      if (userRole !== "SUPER_ADMIN" && userRole !== "SALES_ADMIN") {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
    }

    // 2. Billing (Super Admin & Front Desk Only)
    if (nextUrl.pathname.startsWith("/billing")) {
      if (userRole !== "SUPER_ADMIN" && userRole !== "FRONT_DESK") {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
