import { NextResponse, type NextRequest } from "next/server";
import { accessForPath, hasAllPermissions, isRole, type Role } from "./lib/auth/roles";
import { demoUser, SESSION_COOKIE_NAME, verifySignedSessionToken, type AuthUser } from "./lib/auth/session-token";

function authRequired() {
  return process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";
}

function demoRole(): Role {
  return isRole(process.env.MUNI_DEV_ROLE) ? process.env.MUNI_DEV_ROLE : "admin";
}

async function userFromRequest(request: NextRequest): Promise<AuthUser | null> {
  if (!authRequired()) {
    return demoUser(demoRole(), process.env.WORKFLOW_TENANT_ID ?? "prototype");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySignedSessionToken(token, process.env.MUNI_SESSION_SECRET);
}

function isApiRequest(pathname: string) {
  return pathname.startsWith("/api/") || pathname.startsWith("/v1/");
}

function deny(request: NextRequest, access: ReturnType<typeof accessForPath>, user: AuthUser | null) {
  const status = user ? 403 : 401;
  const payload = {
    error: user ? "INSUFFICIENT_PERMISSION" : "AUTHENTICATION_REQUIRED",
    message: user
      ? "Your institutional role does not permit this operation."
      : "A valid institutional session is required.",
    requiredRoles: access.roles,
    requiredPermissions: access.permissions,
    actualRole: user?.role ?? "public",
    reason: access.reason
  };

  if (isApiRequest(request.nextUrl.pathname)) {
    return NextResponse.json(payload, { status });
  }

  const deniedUrl = request.nextUrl.clone();
  deniedUrl.pathname = "/access-denied";
  deniedUrl.search = "";
  deniedUrl.searchParams.set("reason", user ? "insufficient_permission" : "authentication_required");
  deniedUrl.searchParams.set("returnTo", request.nextUrl.pathname);
  deniedUrl.searchParams.set("required", access.roles.join(","));
  return NextResponse.redirect(deniedUrl, 307);
}

export async function middleware(request: NextRequest) {
  const access = accessForPath(request.nextUrl.pathname, request.method);
  if (access.public) return NextResponse.next();

  const user = await userFromRequest(request);
  if (!user || !hasAllPermissions(user.role, access.permissions)) {
    return deny(request, access, user);
  }

  const response = NextResponse.next();
  response.headers.set("x-muni-auth-role", user.role);
  response.headers.set("x-muni-auth-mode", user.authProvider);
  response.headers.set("x-muni-tenant-id", user.tenantId);
  response.headers.set("x-muni-user-id", user.id);
  return response;
}

export const config = {
  matcher: [
    "/",
    "/access-denied",
    "/actions/:path*",
    "/admin/:path*",
    "/briefings/:path*",
    "/docs-api/:path*",
    "/financial-pulse/:path*",
    "/findings/:path*",
    "/intervention-queue/:path*",
    "/municipalities/:path*",
    "/recovery/:path*",
    "/search/:path*",
    "/sources/:path*",
    "/api/v1/:path*",
    "/v1/:path*"
  ]
};
