import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update session for all matched routes
  const sessionResponse = await updateSession(request);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If authenticated user visits the landing page (/), redirect to /dashboard
  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If unauthenticated user tries to access /dashboard, redirect to /auth
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // If unauthenticated user tries to access any other protected route (not /auth, not /, not /blog), redirect to /auth
  if (
    !user &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/blog") &&
    pathname !== "/"
  ) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
