import { isRole, type Role } from "./roles";

export const SESSION_COOKIE_NAME = "muni_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type AuthProvider = "demo" | "firebase" | "signed_session";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: Role;
  authProvider: AuthProvider;
  issuedAt?: number;
  expiresAt?: number;
};

type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  tenantId: string;
  role: Role;
  authProvider?: AuthProvider;
  iat: number;
  exp: number;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = globalThis.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodePayload(encodedPayload: string): SessionPayload | null {
  try {
    const decoded = new TextDecoder().decode(decodeBase64Url(encodedPayload));
    const payload = JSON.parse(decoded) as Partial<SessionPayload>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.tenantId !== "string" ||
      !isRole(payload.role) ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

async function verifySignature(encodedPayload: string, encodedSignature: string, secret: string) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    return crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedPayload)
    );
  } catch {
    return false;
  }
}

export async function verifySignedSessionToken(token: string | undefined, secret: string | undefined, nowSeconds = Math.floor(Date.now() / 1000)): Promise<AuthUser | null> {
  if (!token || !secret || secret.length < 32) return null;

  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return null;

  const payload = decodePayload(encodedPayload);
  if (!payload || payload.exp <= nowSeconds || payload.iat > nowSeconds + 60) return null;

  const signatureValid = await verifySignature(encodedPayload, encodedSignature, secret);
  if (!signatureValid) return null;

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    tenantId: payload.tenantId,
    role: payload.role,
    authProvider: payload.authProvider ?? "signed_session",
    issuedAt: payload.iat,
    expiresAt: payload.exp
  };
}

export function demoUser(role: Role, tenantId = "prototype"): AuthUser {
  return {
    id: "demo-user",
    email: "demo@muniatlas.local",
    name: "MuniAtlas Demo User",
    tenantId,
    role,
    authProvider: "demo"
  };
}
