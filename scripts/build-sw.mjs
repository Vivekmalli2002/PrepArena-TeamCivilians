// Post-build: writes out/sw.js with a precache list of every route and static asset in the export.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push("/" + relative(out, p).split("\\").join("/"));
  }
})(out);

const routes = files
  .filter((f) => f.endsWith(".html") && !/\/(404|_not-found)\.html$/.test(f))
  .map((f) => (f === "/index.html" ? "/" : f.replace(/\.html$/, "")));

const assets = files.filter(
  (f) =>
    !f.endsWith(".html") &&
    f !== "/sw.js" &&
    !f.endsWith(".woff") && // every browser that runs a service worker uses the .woff2
    !f.endsWith(".map") &&
    // Font subsets load by unicode-range; precache Latin only, others are cached on first use.
    !(/\.woff2$/.test(f) && !/-latin-wght/.test(f)) &&
    !f.includes("_not-found") &&
    !f.startsWith("/data/q/civil-core/") && // large; fetched on demand and cached on first use

    f !== "/favicon.ico",
);

const hash = createHash("sha256");
for (const f of files.sort()) hash.update(f).update(readFileSync(join(out, f)));
const version = hash.digest("hex").slice(0, 12);

const sw = readFileSync(join(root, "scripts/sw-template.js"), "utf8")
  .replace("__VERSION__", version)
  .replace("__ROUTES__", JSON.stringify(routes))
  .replace("__ASSETS__", JSON.stringify(assets));
writeFileSync(join(out, "sw.js"), sw);

const bytes = assets.reduce((n, f) => n + statSync(join(out, f)).size, 0);
console.log(`sw: ${routes.length} routes + ${assets.length} assets (${(bytes / 1024).toFixed(0)} KB) precached, v${version}`);
