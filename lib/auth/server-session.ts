import "server-only";

import { cookies } from "next/headers";
import { demoUser, SESSION_COOKIE_NAME, verifySignedSessionToken, type AuthUser } from "./session-token";
import { isRole } from "./roles";

export function isAuthenticationRequired() {
  return process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";
}

export function getDemoRole() {
  return isRole(process.env.MUNI_DEV_ROLE) ? process.env.MUNI_DEV_ROLE : "admin";
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isAuthenticationRequired()) {
    return demoUser(getDemoRole(), process.env.WORKFLOW_TENANT_ID ?? "prototype");
  }

  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySignedSessionToken(token, process.env.MUNI_SESSION_SECRET);
}
