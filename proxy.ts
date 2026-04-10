import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // --- AUTOMATIC SLUG SANITIZATION (The 404 Fix) ---
  // If the path starts with /pahlajanis, strip it and redirect
  if (path.startsWith("/pahlajanis")) {
    const newPath = path.replace("/pahlajanis", "");
    url.pathname = newPath || "/";
    console.log(`Middleware: Redirecting legacy path ${path} -> ${url.pathname}`);
    return NextResponse.redirect(url, { status: 301 });
  }

  // --- AUTH PROTECTIONS ---
  const isAuthPath = path.startsWith("/login") || path.startsWith("/register");
  
  // If authenticated user hits /login, send them to the root dashboard
  if (isAuthPath && user) {
    url.pathname = "/leads";
    return NextResponse.redirect(url);
  }

  // If unauthenticated user hits dashboard, send them to login
  const isDashboardPath = !isAuthPath && !path.startsWith("/api") && path !== "/";
  if (isDashboardPath && !user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
