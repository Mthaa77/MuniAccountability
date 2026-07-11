import crypto from "node:crypto";

export const E2E_SESSION_SECRET = process.env.MUNI_E2E_SESSION_SECRET ?? "muniatlas-e2e-session-secret-0123456789abcdef";

export function createSessionToken(role, overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: overrides.sub ?? `e2e-${role}`,
    email: overrides.email ?? `${role}@muniatlas.test`,
    name: overrides.name ?? `E2E ${role.replaceAll("_", " ")}`,
    tenantId: overrides.tenantId ?? "e2e-tenant",
    role,
    authProvider: "signed_session",
    iat: now,
    exp: overrides.exp ?? now + 60 * 60
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", E2E_SESSION_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function sessionCookie(role, baseURL, overrides = {}) {
  const url = new URL(baseURL);
  return {
    name: "muni_session",
    value: createSessionToken(role, overrides),
    domain: url.hostname,
    path: "/",
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "Lax"
  };
}

export async function authenticateAs(context, role, baseURL, overrides = {}) {
  await context.clearCookies();
  await context.addCookies([sessionCookie(role, baseURL, overrides)]);
}

export async function signOut(context) {
  await context.clearCookies();
}
