"use client";

import { createContext, useContext, useMemo } from "react";
import { canAccessPath, hasPermission, roleLabels, type Permission, type Role } from "@/lib/auth/roles";
import type { AuthUser } from "@/lib/auth/session-token";

type AccessContextValue = {
  user: AuthUser | null;
  role: Role;
  roleLabel: string;
  can: (permission: Permission) => boolean;
  canVisit: (pathname: string, method?: string) => boolean;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ user, children }: { user: AuthUser | null; children: React.ReactNode }) {
  const value = useMemo<AccessContextValue>(() => {
    const role = user?.role ?? "public";
    return {
      user,
      role,
      roleLabel: roleLabels[role],
      can: (permission) => hasPermission(role, permission),
      canVisit: (pathname, method = "GET") => canAccessPath(role, pathname, method)
    };
  }, [user]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) throw new Error("useAccess must be used inside AccessProvider");
  return context;
}
