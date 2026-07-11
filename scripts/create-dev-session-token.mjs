import crypto from "node:crypto";

const validRoles = new Set(["public", "viewer", "analyst", "reviewer", "admin", "super_admin"]);

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

const secret = argument("secret", process.env.MUNI_SESSION_SECRET);
const role = argument("role", process.env.MUNI_DEV_ROLE ?? "admin");
const tenantId = argument("tenant", process.env.WORKFLOW_TENANT_ID ?? "prototype");
const email = argument("email", "developer@muniatlas.local");
const name = argument("name", "MuniAtlas Developer");
const hours = Number(argument("hours", "8"));

if (!secret || secret.length < 32) {
  console.error("MUNI_SESSION_SECRET must contain at least 32 characters.");
  process.exit(1);
}

if (!validRoles.has(role)) {
  console.error(`Invalid role: ${role}. Expected one of ${Array.from(validRoles).join(", ")}.`);
  process.exit(1);
}

if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
  console.error("--hours must be greater than 0 and no more than 24.");
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const payload = {
  sub: `dev-${role}`,
  email,
  name,
  tenantId,
  role,
  authProvider: "signed_session",
  iat: now,
  exp: now + Math.round(hours * 60 * 60)
};

const encodedPayload = base64Url(JSON.stringify(payload));
const signature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
const token = `${encodedPayload}.${signature}`;

console.log("Signed development session created. Do not commit or share this token.\n");
console.log(token);
console.log("\nCookie value:");
console.log(`muni_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.round(hours * 60 * 60)}`);
