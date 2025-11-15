import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/admin/sign-in",
  "/",
];

const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/admin/sign-in",
];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/teacher",
  "/student",
  "/settings",
  "/profile",
];

// Role-based route access configuration
const ROUTE_ROLE_CONFIG: Record<string, string[]> = {
  "/admin": ["SUPER_ADMIN", "ADMIN"],
  "/teacher": ["INTERNAL_TEACHER", "EXTERNAL_TEACHER"],
};

// External teachers can only access these specific routes
const EXTERNAL_TEACHER_ALLOWED_ROUTES = [
  "/teacher/transfers",
  "/teacher/profile",
  "/teacher/settings",
  "/teacher/change-password",
  "/teacher/classes", // Can view classes they're assigned to
];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

function matchesAny(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route);
}

/**
 * Get user role from JWT token (server-side)
 */
function getUserRoleFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded.role;
  } catch {
    return null;
  }
}

/**
 * Check if a role can access a specific route
 */
function canRoleAccessRoute(role: string, pathname: string): boolean {
  // External teachers have limited access
  if (role === "EXTERNAL_TEACHER") {
    return EXTERNAL_TEACHER_ALLOWED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
  }

  // Check route prefix permissions
  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ROLE_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      return allowedRoles.includes(role);
    }
  }

  // Default: allow access for authenticated users
  return true;
}

/**
 * Get the appropriate redirect path based on role
 */
function getDashboardForRole(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin";
    case "INTERNAL_TEACHER":
      return "/teacher";
    case "EXTERNAL_TEACHER":
      return "/teacher/transfers";
    default:
      return "/";
  }
}

/**
 * Get the appropriate sign-in path based on attempted route
 */
function getSignInPath(pathname: string): string {
  if (pathname.startsWith("/admin")) {
    return "/admin/sign-in";
  }
  return "/sign-in";
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for authentication tokens in cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isAuthenticated = !!(accessToken || refreshToken);

  // Check if this is a public route first
  const isPublicRoute = matchesAny(pathname, PUBLIC_ROUTES);

  // Get user role from token (server-side validation)
  const userRole = accessToken ? getUserRoleFromToken(accessToken) : null;

  // If user is authenticated and trying to access auth routes, redirect to appropriate dashboard
  if (isAuthenticated && matchesAny(pathname, AUTH_ROUTES)) {
    const dashboardPath = userRole ? getDashboardForRole(userRole) : "/";
    const dashboardUrl = new URL(dashboardPath, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If user is not authenticated and trying to access protected routes
  if (
    !isAuthenticated &&
    !isPublicRoute &&
    startsWithAny(pathname, PROTECTED_PREFIXES)
  ) {
    const signInPath = getSignInPath(pathname);
    const signInUrl = new URL(signInPath, request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // SERVER-SIDE ROLE VALIDATION
  // If user is authenticated but trying to access a route they're not allowed to
  if (
    isAuthenticated &&
    userRole &&
    startsWithAny(pathname, PROTECTED_PREFIXES) &&
    !matchesAny(pathname, AUTH_ROUTES)
  ) {
    if (!canRoleAccessRoute(userRole, pathname)) {
      // Redirect to their appropriate dashboard
      const dashboardPath = getDashboardForRole(userRole);
      const dashboardUrl = new URL(dashboardPath, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // For all other cases, allow the request
  return NextResponse.next();
}

export const metadata = {
  other: {
    "Cache-Control": "no-store, must-revalidate",
  },
};


export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files
  // - _next internal routes
  // - public assets
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
