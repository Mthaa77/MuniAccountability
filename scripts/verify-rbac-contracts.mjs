import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));

const roles = read("lib", "auth", "roles.ts");
const sessionToken = read("lib", "auth", "session-token.ts");
const serverSession = read("lib", "auth", "server-session.ts");
const middleware = read("middleware.ts");
const layout = read("app", "layout.tsx");
const shell = read("components", "app-shell.tsx");
const accessProvider = read("components", "auth", "access-provider.tsx");
const accessDenied = read("app", "access-denied", "page.tsx");
const firestoreRules = read("firestore.rules");
const storageRules = read("storage.rules");
const envExample = read(".env.example");
const docs = read("docs", "AUTH_RBAC.md");

for (const requiredFile of [
  ["lib", "auth", "roles.ts"],
  ["lib", "auth", "session-token.ts"],
  ["lib", "auth", "server-session.ts"],
  ["components", "auth", "access-provider.tsx"],
  ["app", "access-denied", "page.tsx"],
  ["components", "atlas", "atlas-rbac.css"],
  ["firestore.rules"],
  ["storage.rules"],
  ["docs", "AUTH_RBAC.md"]
]) {
  assert(exists(...requiredFile), `Missing RBAC file: ${requiredFile.join("/")}`);
}

[
  '"public"',
  '"viewer"',
  '"analyst"',
  '"reviewer"',
  '"admin"',
  '"super_admin"',
  '"workspace.read"',
  '"actions.write"',
  '"agsa.review"',
  '"readiness.manage"',
  '"system.manage"',
  "rolePermissions",
  "accessForPath",
  "canAccessPath",
  "hasAllPermissions",
  'pathname.startsWith("/munidata")',
  "Unclassified institutional route (deny by default)"
].forEach((token) => assert(roles.includes(token), `Role policy missing ${token}.`));

[
  "SESSION_COOKIE_NAME",
  '"muni_session"',
  "HMAC",
  'hash: "SHA-256"',
  "payload.exp <= nowSeconds",
  "verifySignedSessionToken",
  "secret.length < 32"
].forEach((token) => assert(sessionToken.includes(token), `Session verifier missing ${token}.`));

[
  "getCurrentUser",
  "NEXT_PUBLIC_REQUIRE_AUTH",
  "MUNI_DEV_ROLE",
  "MUNI_SESSION_SECRET",
  "cookies().get(SESSION_COOKIE_NAME)"
].forEach((token) => assert(serverSession.includes(token), `Server session resolver missing ${token}.`));

[
  "verifySignedSessionToken",
  "SESSION_COOKIE_NAME",
  "hasAllPermissions",
  "AUTHENTICATION_REQUIRED",
  "INSUFFICIENT_PERMISSION",
  'deniedUrl.pathname = "/access-denied"',
  'response.headers.set("x-muni-tenant-id"',
  'response.headers.set("x-muni-user-id"',
  "_next/static",
  "_next/image",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml"
].forEach((token) => assert(middleware.includes(token), `Middleware RBAC contract missing ${token}.`));

assert(!middleware.includes('request.headers.get("x-muni-role")'), "Middleware must not trust client-supplied x-muni-role headers.");
assert(!middleware.includes("headerRole"), "Legacy client role-header trust must remain removed.");

[
  "getCurrentUser",
  "AccessProvider",
  "atlas-rbac.css"
].forEach((token) => assert(layout.includes(token), `Root layout RBAC wiring missing ${token}.`));

[
  "useAccess",
  "canVisit",
  "access-identity",
  "data-auth-role",
  "roleDescriptions",
  'canVisit("/api/v1/assistant/query", "POST")'
].forEach((token) => assert(shell.includes(token), `App shell role-aware contract missing ${token}.`));

[
  "createContext",
  "hasPermission",
  "canAccessPath",
  "roleLabel"
].forEach((token) => assert(accessProvider.includes(token), `Access provider missing ${token}.`));

[
  "Institutional access control",
  "No protected data was disclosed.",
  "least-privilege principles",
  "Open public MuniCheck"
].forEach((token) => assert(accessDenied.includes(token), `Access denied page missing ${token}.`));

[
  "tokenTenantId",
  "belongsToTenant",
  "super_admin",
  "reviewDecisions",
  "productionGateReviews",
  "draftActions",
  "auditLogs"
].forEach((token) => assert(firestoreRules.includes(token), `Firestore RBAC rules missing ${token}.`));

[
  "tokenTenantId",
  "belongsToTenant",
  "allowedEvidenceType",
  "request.resource.size < 20 * 1024 * 1024",
  "super_admin",
  "restricted"
].forEach((token) => assert(storageRules.includes(token), `Storage RBAC rules missing ${token}.`));

[
  "NEXT_PUBLIC_REQUIRE_AUTH",
  "MUNI_DEV_ROLE",
  "MUNI_SESSION_SECRET"
].forEach((token) => assert(envExample.includes(token), `.env.example missing ${token}.`));

[
  "least-privilege",
  "signed session cookies",
  "does not trust a browser-supplied `x-muni-role` header",
  "Firebase production flow",
  "session revocation",
  "MFA policy",
  "deny by default"
].forEach((token) => assert(docs.includes(token), `AUTH_RBAC documentation missing ${token}.`));

const secret = "institutional-test-secret-0123456789abcdef";
const generated = spawnSync(
  process.execPath,
  ["scripts/create-dev-session-token.mjs", "--secret", secret, "--role", "reviewer", "--tenant", "qa-tenant", "--hours", "1"],
  { cwd: root, encoding: "utf8" }
);

assert.equal(generated.status, 0, `Development session utility failed: ${generated.stderr}`);
const tokenMatch = generated.stdout.match(/\n([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\n/);
assert(tokenMatch, "Development session utility did not output a signed token.");

const [encodedPayload, signature] = tokenMatch[1].split(".");
const expectedSignature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
assert.equal(signature, expectedSignature, "Development session token signature does not match HMAC-SHA256 contract.");

const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
assert.equal(payload.role, "reviewer");
assert.equal(payload.tenantId, "qa-tenant");
assert.equal(payload.authProvider, "signed_session");
assert(payload.exp > payload.iat, "Development session token must expire after it is issued.");

console.log("RBAC contracts verified: roles, permissions, fail-closed routing, signed sessions, tenant rules, middleware, role-aware navigation and docs are aligned.");
