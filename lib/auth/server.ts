import { hasRole, isRole, type Role } from "./roles";

export type AuthContext = {
  enabled: boolean;
  role: Role;
  tenantId: string;
  reason: string;
};

function authEnabled() {
  return process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";
}

function defaultTenantId() {
  return process.env.WORKFLOW_TENANT_ID || "prototype";
}

export function getAuthContextFromHeaders(headers: Headers): AuthContext {
  const enabled = authEnabled();
  const headerRole = headers.get("x-muni-role");
  const devRole = process.env.MUNI_DEV_ROLE;
  const role = isRole(headerRole) ? headerRole : isRole(devRole) ? devRole : "public";
  const tenantId = headers.get("x-muni-tenant") || defaultTenantId();

  return {
    enabled,
    role: enabled ? role : "admin",
    tenantId,
    reason: enabled ? "Auth guard enabled" : "Demo mode allows local prototype access"
  };
}

export function assertRole(context: AuthContext, requiredRoles: Role[]) {
  if (!context.enabled) return { allowed: true, reason: context.reason };
  const allowed = requiredRoles.some((requiredRole) => hasRole(context.role, requiredRole));
  return {
    allowed,
    reason: allowed ? "Role allowed" : `Role ${context.role} cannot access this resource.`
  };
}

export function firebaseAuthIntegrationNote() {
  return "Production mode should replace the demo header role with Firebase Auth ID-token verification and custom claims.";
}
