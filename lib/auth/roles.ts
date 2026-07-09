export const roles = ["public", "analyst", "reviewer", "admin"] as const;

export type Role = (typeof roles)[number];

export const roleRank: Record<Role, number> = {
  public: 0,
  analyst: 1,
  reviewer: 2,
  admin: 3
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (roles as readonly string[]).includes(value);
}

export function hasRole(userRole: Role, required: Role | Role[]) {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((role) => roleRank[userRole] >= roleRank[role]);
}

export function requiredRolesForPath(pathname: string, method = "GET"): Role[] {
  const upperMethod = method.toUpperCase();

  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/api-docs")) return ["analyst", "reviewer", "admin"];

  if (pathname.startsWith("/v1/production-evidence/reviews") || pathname.startsWith("/api/v1/production-evidence/reviews")) {
    return upperMethod === "GET" ? ["admin"] : ["admin"];
  }

  if (pathname.startsWith("/v1/agsa/review-decisions") || pathname.startsWith("/api/v1/agsa/review-decisions")) {
    return upperMethod === "GET" ? ["reviewer", "admin"] : ["reviewer", "admin"];
  }

  if (upperMethod !== "GET" && (pathname.startsWith("/v1/actions") || pathname.startsWith("/api/v1/actions"))) {
    return ["analyst", "reviewer", "admin"];
  }

  if (upperMethod !== "GET" && (pathname.startsWith("/v1/intervention-queue") || pathname.startsWith("/api/v1/intervention-queue"))) {
    return ["analyst", "reviewer", "admin"];
  }

  if (upperMethod !== "GET" && (pathname.startsWith("/v1/assistant") || pathname.startsWith("/api/v1/assistant"))) {
    return ["analyst", "reviewer", "admin"];
  }

  return ["public"];
}
