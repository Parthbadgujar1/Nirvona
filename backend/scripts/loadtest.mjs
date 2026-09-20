// Load test: many simulated students hitting the API at once.
//
//   node scripts/loadtest.mjs --targets http://127.0.0.1:8101,http://127.0.0.1:8102 \
//        --users 500 --seconds 30 --think 3000 --tokens tokens.json
//
// Each virtual user repeatedly does what a student does - loads the public
// catalogue, then opens dashboard / profile / payments / exams / results /
// notifications - with a random "think time" between clicks. Requests are
// spread round-robin over --targets (one per PHP worker / server), the way a
// load balancer or php-fpm pool would.
//
// Prints throughput, latency percentiles and every non-200 status.
// --think 0 = closed-loop stress (finds the ceiling); --think 3000 = realistic.
//
// --tokens: JSON array of student JWTs (mint with scripts/mint-tokens.php).

import fs from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const targets = (args.targets ?? "http://127.0.0.1:8000").split(",");
const users = Number(args.users ?? 100);
const seconds = Number(args.seconds ?? 20);
const think = Number(args.think ?? 3000);
const tokens = args.tokens ? JSON.parse(fs.readFileSync(args.tokens, "utf8")) : [];

const anon = ["/api/courses", "/api/packages", "/api/packages/PKG"];
const authed = [
  "/api/students/me", "/api/students/me/dashboard", "/api/students/me/enrollments", "/api/students/me/payments",
  "/api/students/me/notifications/unread-count", "/api/students/me/exams", "/api/students/me/results",
  "/api/students/me/notifications", "/api/students/me/admit-card",
];

const lat = [];
const statuses = new Map();
const perPath = new Map();
let rr = 0;
const stopAt = Date.now() + seconds * 1000;

async function hit(path, token) {
  const base = targets[rr++ % targets.length];
  const t0 = performance.now();
  let status = 0;
  try {
    const r = await fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    await r.arrayBuffer();
    status = r.status;
  } catch {
    status = -1; // connection error / timeout
  }
  const ms = performance.now() - t0;
  lat.push(ms);
  statuses.set(status, (statuses.get(status) ?? 0) + 1);
  const p = path.replace(/[0-9a-f-]{36}/, ":id");
  const s = perPath.get(p) ?? { n: 0, sum: 0, max: 0 };
  s.n++; s.sum += ms; s.max = Math.max(s.max, ms);
  perPath.set(p, s);
}

let pkgId = null;
{
  const r = await fetch(targets[0] + "/api/packages").then((x) => x.json());
  pkgId = r.data?.[0]?.id ?? "x";
}

async function user(i) {
  const token = tokens.length ? tokens[i % tokens.length] : null;
  // stagger start so 500 users don't all fire in the same millisecond
  await new Promise((r) => setTimeout(r, Math.random() * Math.min(think || 1000, 5000)));
  while (Date.now() < stopAt) {
    // a "page view": one or two API calls
    const path = token && Math.random() < 0.85 ? authed[Math.floor(Math.random() * authed.length)] : anon[Math.floor(Math.random() * anon.length)];
    await hit(path.replace("PKG", pkgId), path.startsWith("/api/students") ? token : null);
    if (think > 0) await new Promise((r) => setTimeout(r, think * (0.5 + Math.random())));
  }
}

const t0 = Date.now();
await Promise.all(Array.from({ length: users }, (_, i) => user(i)));
const elapsed = (Date.now() - t0) / 1000;

lat.sort((a, b) => a - b);
const pct = (p) => lat[Math.min(lat.length - 1, Math.floor(lat.length * p))].toFixed(0);
console.log(`\n${users} virtual users, ${targets.length} server(s), think ${think} ms, ${elapsed.toFixed(0)} s`);
console.log(`requests: ${lat.length}   throughput: ${(lat.length / elapsed).toFixed(0)} req/s`);
console.log(`latency ms  p50 ${pct(0.5)}  p90 ${pct(0.9)}  p95 ${pct(0.95)}  p99 ${pct(0.99)}  max ${lat.at(-1).toFixed(0)}`);
console.log("status codes:", [...statuses].map(([s, n]) => `${s === -1 ? "conn-error" : s}: ${n}`).join("   "));
console.log("slowest endpoints (avg ms):");
[...perPath].sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n).slice(0, 5)
  .forEach(([p, s]) => console.log(`   ${(s.sum / s.n).toFixed(0).padStart(5)}  ${p}  (${s.n} calls)`));
