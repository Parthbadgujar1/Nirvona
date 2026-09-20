// Production static server for the built app (dist/), zero dependencies.
//
//   npm run serve                 # builds, then serves on http://localhost:3000
//   PORT=8080 API_ORIGIN=https://api.example.com node scripts/serve.mjs
//
// Why not the Vite dev server: `vite dev` sends ~400 separate unbundled
// modules and is meant for development only. This serves the optimised
// bundle the way a real host would:
//   - gzip/brotli compression, done once and kept in memory
//   - /assets/* are content-hashed, so they are cached for a year (`immutable`)
//     - a returning visitor downloads nothing for them
//   - index.html is never cached, so a new deploy is picked up immediately
//   - security headers incl. a strict Content-Security-Policy
//   - single-page-app fallback (any unknown path serves index.html)
// For big deployments put nginx in front instead (see deploy/nginx.conf).

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT ?? 3000);
// "::" listens on IPv6 and IPv4 together. On Windows "localhost" resolves to ::1 first, and a
// server bound only to IPv4 makes every new connection wait for that attempt to fail.
const host = process.env.HOST ?? "::";
const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:8000";

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("dist/ not found - run `npm run build` first (or use `npm run serve`).");
  process.exit(1);
}

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // Tailwind/Radix/Framer set inline style attributes
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const baseHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": csp,
};

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json",
};
const compressible = new Set([".html", ".js", ".mjs", ".css", ".json", ".svg", ".txt", ".webmanifest", ".ico"]);

/** @type {Map<string, {raw: Buffer, br?: Buffer, gzip?: Buffer, etag: string, type: string, immutable: boolean}>} */
const cache = new Map();

function load(file) {
  let entry = cache.get(file);
  if (entry) return entry;
  const raw = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  entry = {
    raw,
    type: types[ext] ?? "application/octet-stream",
    etag: `"${zlib.crc32 ? zlib.crc32(raw).toString(16) : raw.length.toString(16)}-${raw.length.toString(16)}"`,
    immutable: file.includes(`${path.sep}assets${path.sep}`),
  };
  if (compressible.has(ext) && raw.length > 512) {
    entry.br = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } });
    entry.gzip = zlib.gzipSync(raw, { level: 9 });
  }
  cache.set(file, entry);
  return entry;
}

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const target = path.normalize(path.join(root, clean));
  // Path traversal guard: the resolved file must stay inside dist/.
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;
  // A missing file with an extension is a real 404 (don't hand HTML to a <script>);
  // an extension-less path is a client-side route -> index.html.
  if (path.extname(clean)) return undefined;
  return path.join(root, "index.html");
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", ...baseHeaders }).end();
    return;
  }

  let file;
  try {
    file = resolveFile(req.url ?? "/");
  } catch {
    res.writeHead(400, baseHeaders).end("Bad request");
    return;
  }
  if (file === null || file === undefined) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...baseHeaders }).end("Not found");
    return;
  }

  const entry = load(file);
  const isIndex = file.endsWith(`${path.sep}index.html`);
  const headers = {
    ...baseHeaders,
    "Content-Type": entry.type,
    "Cache-Control": entry.immutable ? "public, max-age=31536000, immutable" : isIndex ? "no-cache" : "public, max-age=3600",
    ETag: entry.etag,
    Vary: "Accept-Encoding",
  };

  if (req.headers["if-none-match"] === entry.etag) {
    res.writeHead(304, headers).end();
    return;
  }

  const accept = String(req.headers["accept-encoding"] ?? "");
  let body = entry.raw;
  if (entry.br && /\bbr\b/.test(accept)) {
    body = entry.br;
    headers["Content-Encoding"] = "br";
  } else if (entry.gzip && /\bgzip\b/.test(accept)) {
    body = entry.gzip;
    headers["Content-Encoding"] = "gzip";
  }
  headers["Content-Length"] = body.length;
  res.writeHead(200, headers);
  res.end(req.method === "HEAD" ? undefined : body);
});

// Compress everything up front so the first visitor is as fast as the thousandth.
(function warm(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.statSync(p).isDirectory() ? warm(p) : load(p);
  }
})(root);

server.listen(port, host, () => {
  console.log(`Serving dist/ on http://localhost:${port}  (API allowed by CSP: ${apiOrigin})`);
});
