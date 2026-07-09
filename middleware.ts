import { NextResponse, type NextRequest } from "next/server";
import { hasRole, isRole, requiredRolesForPath, type Role } from "./lib/auth/roles";

function authRequired() {
  return process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";
}

function roleFromRequest(request: NextRequest): Role {
  const headerRole = request.headers.get("x-muni-role");
  const envRole = process.env.MUNI_DEV_ROLE;

  if (isRole(headerRole)) return headerRole;
  if (isRole(envRole)) return envRole;
  return "public";
}

function deny(request: NextRequest, requiredRoles: Role[], actualRole: Role) {
  const payload = {
    error: "AUTH_REQUIRED",
    message: "Firebase Auth role enforcement is prepared for this route.",
    requiredRoles,
    actualRole
  };

  if (request.nextUrl.pathname.startsWith("/v1") || request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json(payload, { status: 403 });
  }

  return new NextResponse(`Access requires: ${requiredRoles.join(" or ")}. Current role: ${actualRole}.`, {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

export function middleware(request: NextRequest) {
  if (!authRequired()) return NextResponse.next();

  const requiredRoles = requiredRolesForPath(request.nextUrl.pathname, request.method);
  if (requiredRoles.includes("public")) return NextResponse.next();

  const actualRole = roleFromRequest(request);
  const allowed = requiredRoles.some((requiredRole) => hasRole(actualRole, requiredRole));

  if (!allowed) return deny(request, requiredRoles, actualRole);

  const response = NextResponse.next();
  response.headers.set("x-muni-auth-role", actualRole);
  response.headers.set("x-muni-auth-mode", "prepared-firebase-boundary");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api-docs/:path*", "/v1/:path*", "/api/v1/:path*"]
};
