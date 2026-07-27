/**
 * After `next build` with output: 'standalone', ensure public + static
 * are copied if electron-builder extraResources needs a complete folder.
 * Next already copies some files; this is a safety net for monorepo layouts.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn("skip missing", src);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(standalone)) {
  console.error("Missing .next/standalone — run next build with output: 'standalone' first");
  process.exit(1);
}

// Ensure static assets inside standalone for server
copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
copyDir(path.join(root, "public"), path.join(standalone, "public"));

// Desktop env defaults for packaged server
const envHint = path.join(standalone, ".env.production");
if (!fs.existsSync(envHint)) {
  fs.writeFileSync(
    envHint,
    "NEXT_PUBLIC_DESKTOP=true\nNEXT_PUBLIC_DEMO_MODE=true\n",
    "utf8"
  );
}

console.log("Standalone prepared for Electron packaging.");
