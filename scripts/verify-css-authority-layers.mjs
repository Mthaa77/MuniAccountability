import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const layout = read("app", "layout.tsx");
const cssLayers = read("docs", "CSS_LAYERS.md");
const atlasReadme = read("components", "atlas", "README.md");

const finalImports = [
  "atlas-compact-desktop-rescue.css",
  "atlas-desktop-shell-fix.css",
  "atlas-device-polish.css",
  "atlas-button-system.css",
  "atlas-elegance.css",
  "atlas-navigation-revamp.css"
];

const importPositions = finalImports.map((file) => {
  const token = `@/components/atlas/${file}`;
  const position = layout.indexOf(token);
  assert(position >= 0, `app/layout.tsx must import ${file}.`);
  return { file, position };
});

for (let index = 1; index < importPositions.length; index += 1) {
  assert(
    importPositions[index].position > importPositions[index - 1].position,
    `${importPositions[index].file} must be imported after ${importPositions[index - 1].file}.`
  );
}

const compactRescue = read("components", "atlas", "atlas-compact-desktop-rescue.css");
const desktopFix = read("components", "atlas", "atlas-desktop-shell-fix.css");
const devicePolish = read("components", "atlas", "atlas-device-polish.css");
const buttonSystem = read("components", "atlas", "atlas-button-system.css");
const elegance = read("components", "atlas", "atlas-elegance.css");
const navigationRevamp = read("components", "atlas", "atlas-navigation-revamp.css");

[
  "@media (max-width: 1180px)",
  ".premium-sidebar",
  ".premium-workspace",
  "phone browsers using \"Desktop site\""
].forEach((token) => assert(compactRescue.includes(token), `Compact desktop rescue missing ${token}.`));

[
  "@media (min-width: 1181px)",
  "grid-template-columns",
  ".premium-sidebar.atlas-sidebar",
  ".premium-workspace.atlas-workspace"
].forEach((token) => assert(desktopFix.includes(token), `Desktop shell fix missing ${token}.`));

[
  "Final device polish layer",
  "--atlas-desktop-sidebar",
  "@media (min-width: 1181px)",
  "@media (max-width: 760px)"
].forEach((token) => assert(devicePolish.includes(token), `Device polish layer missing ${token}.`));

[
  "Premium button system",
  ".primary-action",
  ".secondary-action",
  ".icon-button",
  "@media (max-width: 760px)",
  "prefers-reduced-motion"
].forEach((token) => assert(buttonSystem.includes(token), `Button system layer missing ${token}.`));

[
  "Final elegance authority layer",
  "--atlas-font-body",
  ".workspace-identity",
  ".atlas-tile-signal",
  "prefers-reduced-motion"
].forEach((token) => assert(elegance.includes(token), `Elegance layer missing ${token}.`));

[
  "Premium adaptive navigation authority layer",
  "--nav-collapsed-width",
  ".sidebar-collapse-button",
  ".mobile-bottom-nav",
  ".mobile-navigation-sheet",
  "prefers-reduced-motion"
].forEach((token) => assert(navigationRevamp.includes(token), `Navigation revamp layer missing ${token}.`));

finalImports.forEach((file) => {
  assert(cssLayers.includes(file), `CSS layer docs must mention ${file}.`);
  assert(atlasReadme.includes(file), `Atlas README must mention ${file}.`);
});

console.log("CSS authority layers verified: final imports, desktop/mobile guards and button layer are ordered and documented.");
