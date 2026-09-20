// Static link check: every internal path the UI links or navigates to must
// match a route in src/App.tsx.   Run: node scripts/check-links.mjs
//
// Catches the classic "button goes to a page that no longer exists" bug
// (which the router silently turns into the 404 page). It reads string
// literals in Link/NavLink `to`, <a href>, navigate(...), redirects and the
// nav config, so paths built from variables are checked by their static prefix.

import fs from "node:fs";
import path from "node:path";

const src = path.resolve("src");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : /\.(tsx?|ts)$/.test(e.name) ? [path.join(d, e.name)] : []);
const files = walk(src);

// ---- 1. routes from App.tsx (handles nested <Route path="/admin"> + relative children)
const app = fs.readFileSync(path.join(src, "App.tsx"), "utf8");
const routes = new Set(["/"]);
const stack = [];
for (const line of app.split("\n")) {
  const open = line.match(/<Route\s+(?:element=\{[^}]*\}\s+)?path="([^"]+)"/);
  const close = /<\/Route>/.test(line);
  const selfClosing = /\/>\s*$/.test(line.trim());
  if (open) {
    const full = open[1].startsWith("/") ? open[1] : (stack.at(-1) ?? "") + "/" + open[1];
    routes.add(full);
    if (!selfClosing) stack.push(full);
  } else if (/<Route\b/.test(line) && !selfClosing && !/index/.test(line)) {
    stack.push(stack.at(-1) ?? ""); // layout route without a path
  }
  if (close) stack.pop();
}
const patterns = [...routes].map((r) => new RegExp("^" + r.replace(/:[^/]+/g, "[^/]+") + "/?$"));
const matches = (p) => patterns.some((re) => re.test(p));

// ---- 2. collect internal targets
const found = new Map();
const add = (p, file) => {
  let clean = p.split("?")[0].split("#")[0];
  if (!clean.startsWith("/") || clean.startsWith("//") || clean.startsWith("/api") || clean.startsWith("/brand")
      || clean.startsWith("/assets") || clean === "/favicon.ico") return;
  // template literal with ${...}: keep the static prefix and treat the rest as a param
  clean = clean.replace(/\$\{[^}]*\}/g, "x").replace(/\/+$/, "") || "/";
  (found.get(clean) ?? found.set(clean, new Set()).get(clean)).add(path.relative(src, file));
};
const rx = [
  /\bto=(?:\{)?["'`](\/[^"'`]*)["'`]/g,
  /\bhref=(?:\{)?["'`](\/[^"'`]*)["'`]/g,
  /\bnavigate\(\s*["'`](\/[^"'`]*)["'`]/g,
  /\bhref:\s*["'`](\/[^"'`]*)["'`]/g,
  /\b(?:to|link|action|secondaryAction)\s*:\s*["'`](\/[^"'`]*)["'`]/g,
  /<Navigate\s+to=["'](\/[^"']*)["']/g,
  /loginUrl\(\s*["'`](\/[^"'`]*)["'`]/g,
];
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  for (const r of rx) for (const m of text.matchAll(r)) add(m[1], f);
}

// ---- 3. report
let bad = 0;
for (const [p, where] of [...found].sort()) {
  if (!matches(p)) {
    bad++;
    console.log(`  BROKEN  ${p}   (in ${[...where].slice(0, 3).join(", ")})`);
  }
}
console.log(`\n${routes.size} routes, ${found.size} distinct internal link targets checked.`);
console.log(bad === 0 ? "No broken internal links." : `${bad} broken link target(s).`);
process.exit(bad === 0 ? 0 : 1);
