import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components", "lib"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const files = [];

function walk(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return;

  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      walk(path.join(relativePath, entry));
    }
    return;
  }

  if (extensions.has(path.extname(relativePath))) files.push(relativePath);
}

scanRoots.forEach(walk);
files.push("middleware.ts");

const violations = [];

for (const relativePath of files) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const isClient = /^\s*["']use client["'];/m.test(source);

  const checks = [
    { pattern: /\bdebugger\s*;/, message: "debugger statement" },
    { pattern: /@ts-ignore/, message: "@ts-ignore suppression" },
    { pattern: /console\.log\s*\(/, message: "console.log in application code" },
    { pattern: /request\.headers\.get\(["']x-muni-role["']\)/, message: "client-supplied role header trust" },
    { pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, message: "embedded private key" }
  ];

  for (const check of checks) {
    if (check.pattern.test(source)) violations.push(`${relativePath}: ${check.message}`);
  }

  if (isClient && (source.includes("server-only") || source.includes("@/lib/auth/server-session"))) {
    violations.push(`${relativePath}: client component imports server-only authentication code`);
  }
}

assert.equal(violations.length, 0, `Code hygiene violations:\n${violations.map((item) => `- ${item}`).join("\n")}`);
console.log(`Code hygiene verified across ${files.length} application source files.`);
