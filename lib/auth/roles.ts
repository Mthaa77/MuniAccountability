export const roles = ["public", "viewer", "analyst", "reviewer", "admin", "super_admin"] as const;

export type Role = (typeof roles)[number];

export const permissions = [
  "public.read",
  "workspace.read",
  "evidence.read",
  "actions.read",
  "actions.write",
  "actions.review",
  "briefings.write",
  "agsa.review",
  "readiness.read",
  "readiness.manage",
  "system.manage"
] as const;

export type Permission = (typeof permissions)[number];

export const roleLabels: Record<Role, string> = {
  public: "Public visitor",
  viewer: "Institutional viewer",
  analyst: "Municipal analyst",
  reviewer: "Evidence reviewer",
  admin: "Workspace administrator",
  super_admin: "Platform super administrator"
};

export const roleDescriptions: Record<Role, string> = {
  public: "Can access public-safe MuniCheck and disclosure surfaces.",
  viewer: "Can read institutional dashboards, municipal dossiers and source evidence.",
  analyst: "Can create actions, query evidence and build institutional briefings.",
  reviewer: "Can review actions and accept, correct or exclude AGSA-derived claims.",
  admin: "Can manage readiness gates, data quality and workspace administration.",
  super_admin: "Can manage platform-wide security, tenants and system configuration."
};

export const rolePermissions: Record<Role, readonly Permission[]> = {
  public: ["public.read"],
  viewer: ["public.read", "workspace.read", "evidence.read", "actions.read"],
  analyst: [
    "public.read",
    "workspace.read",
    "evidence.read",
    "actions.read",
    "actions.write",
    "briefings.write"
  ],
  reviewer: [
    "public.read",
    "workspace.read",
    "evidence.read",
    "actions.read",
    "actions.write",
    "actions.review",
    "briefings.write",
    "agsa.review"
  ],
  admin: [
    "public.read",
    "workspace.read",
    "evidence.read",
    "actions.read",
    "actions.write",
    "actions.review",
    "briefings.write",
    "agsa.review",
    "readiness.read",
    "readiness.manage"
  ],
  super_admin: permissions
};

export type RouteAccess = {
  roles: Role[];
  permissions: Permission[];
  reason: string;
  public: boolean;
};

const PUBLIC_ACCESS: RouteAccess = {
  roles: ["public"],
  permissions: ["public.read"],
  reason: "Public-safe route",
  public: true
};

function protectedAccess(rolesAllowed: Role[], permissionsRequired: Permission[], reason: string): RouteAccess {
  return {
    roles: rolesAllowed,
    permissions: permissionsRequired,
    reason,
    public: false
  };
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (roles as readonly string[]).includes(value);
}

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (permissions as readonly string[]).includes(value);
}

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function hasAnyPermission(role: Role, required: readonly Permission[]) {
  return required.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, required: readonly Permission[]) {
  return required.every((permission) => hasPermission(role, permission));
}

export function hasRole(userRole: Role, required: Role | Role[]) {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.includes(userRole) || userRole === "super_admin";
}

export function accessForPath(pathname: string, method = "GET"): RouteAccess {
  const upperMethod = method.toUpperCase();

  if (
    pathname === "/access-denied" ||
    pathname.startsWith("/municheck") ||
    pathname.startsWith("/disclaimer") ||
    pathname.startsWith("/api/v1/municheck") ||
    pathname.startsWith("/v1/municheck") ||
    pathname.startsWith("/api/v1/munidata") ||
    pathname.startsWith("/v1/munidata")
  ) {
    return PUBLIC_ACCESS;
  }

  if (pathname.startsWith("/admin/agsa-review") || pathname.startsWith("/api/v1/agsa/review-decisions") || pathname.startsWith("/v1/agsa/review-decisions")) {
    return protectedAccess(["reviewer", "admin", "super_admin"], ["agsa.review"], "AGSA review governance");
  }

  if (pathname.startsWith("/admin/data-quality")) {
    return protectedAccess(["reviewer", "admin", "super_admin"], ["agsa.review"], "Data quality review");
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/v1/production-") || pathname.startsWith("/v1/production-")) {
    const permission: Permission = upperMethod === "GET" ? "readiness.read" : "readiness.manage";
    return protectedAccess(["admin", "super_admin"], [permission], "Production readiness administration");
  }

  if (pathname.startsWith("/docs-api")) {
    return protectedAccess(["viewer", "analyst", "reviewer", "admin", "super_admin"], ["workspace.read"], "Institutional API documentation");
  }

  if (pathname.startsWith("/briefings")) {
    return protectedAccess(["analyst", "reviewer", "admin", "super_admin"], ["briefings.write"], "Institutional briefing workflow");
  }

  if (pathname.startsWith("/actions") || pathname.startsWith("/api/v1/actions") || pathname.startsWith("/v1/actions")) {
    const permission: Permission = upperMethod === "GET" ? "actions.read" : "actions.write";
    return protectedAccess(
      upperMethod === "GET" ? ["viewer", "analyst", "reviewer", "admin", "super_admin"] : ["analyst", "reviewer", "admin", "super_admin"],
      [permission],
      "Action workflow"
    );
  }

  if (pathname.startsWith("/api/v1/assistant/query") || pathname.startsWith("/v1/assistant/query")) {
    const permission: Permission = upperMethod === "GET" ? "evidence.read" : "actions.write";
    return protectedAccess(
      upperMethod === "GET" ? ["viewer", "analyst", "reviewer", "admin", "super_admin"] : ["analyst", "reviewer", "admin", "super_admin"],
      [permission],
      "Source-locked assistant"
    );
  }

  if (
    pathname === "/" ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/sources") ||
    pathname.startsWith("/municipalities") ||
    pathname.startsWith("/findings") ||
    pathname.startsWith("/intervention-queue") ||
    pathname.startsWith("/recovery") ||
    pathname.startsWith("/financial-pulse") ||
    pathname.startsWith("/api/v1") ||
    pathname.startsWith("/v1")
  ) {
    return protectedAccess(["viewer", "analyst", "reviewer", "admin", "super_admin"], ["workspace.read"], "Institutional workspace");
  }

  return PUBLIC_ACCESS;
}

export function requiredRolesForPath(pathname: string, method = "GET"): Role[] {
  return accessForPath(pathname, method).roles;
}

export function requiredPermissionsForPath(pathname: string, method = "GET"): Permission[] {
  return accessForPath(pathname, method).permissions;
}

export function canAccessPath(role: Role, pathname: string, method = "GET") {
  const access = accessForPath(pathname, method);
  if (access.public) return true;
  return hasAllPermissions(role, access.permissions);
}
