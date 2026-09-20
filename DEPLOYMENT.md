# Deploying Nirvona for 500–1,000+ students

Everything needed to run the site fast and safely under load. The config files
are in [`deploy/`](deploy/).

## 1. What you are deploying

| Piece | What | Where it runs |
|---|---|---|
| Frontend | static files from `npm run build` → `dist/` | nginx |
| API | PHP 8.2 + Slim, `backend/public/index.php` | PHP-FPM behind nginx |
| Database | PostgreSQL | its own server / managed service |
| Cache & rate limits | Redis | its own server / managed service |

Serve the frontend and the API from **one domain** (`/` and `/api`): no CORS
preflights, simpler security, faster.

## 2. Local: fast preview of the production build

```bash
npm run serve        # builds, then serves dist/ on http://localhost:3000
```

This serves the optimised bundle (compressed, cached, security headers) instead
of the Vite dev server, which sends ~400 unbundled files and is for development
only. Use `npm run dev` only while editing code.

## 3. Production setup

### Frontend
```bash
VITE_API_BASE_URL=/api npm run build      # same-origin API
rsync -a --delete dist/ /var/www/nirvona/dist/
```
Install [`deploy/nginx.conf`](deploy/nginx.conf) (edit the domain and TLS paths).
Hashed files under `/assets/` are cached for a year; `index.html` is never cached,
so each deploy is picked up immediately.

### Backend
```bash
cd backend
composer install --no-dev --optimize-autoloader --classmap-authoritative
php migrate.php                     # applies pending database migrations
sudo cp ../deploy/php-fpm-pool.conf /etc/php/8.2/fpm/pool.d/nirvona.conf
sudo cp ../deploy/php-production.ini /etc/php/8.2/fpm/conf.d/99-nirvona.ini
sudo systemctl reload php8.2-fpm    # REQUIRED after every deploy (opcache does not re-check files)
```

### Environment (`backend/.env` or real environment variables)
| Variable | Production value |
|---|---|
| `APP_ENV` | `production` (the API refuses to start with a weak `JWT_SECRET` outside `development`) |
| `APP_DEBUG` | `false` |
| `JWT_SECRET` | 32+ random characters: `php -r "echo bin2hex(random_bytes(32));"`. Changing it signs everyone out. |
| `FRONTEND_URL` | `https://nirvona.example.com` (used for CORS and as PhonePe's return address) |
| `CORS_ORIGINS` | only if the frontend is on a *different* domain than the API |
| `TRUSTED_PROXIES` | IP(s) of your nginx/load balancer, so rate limits see the real client IP. Leave empty if PHP is reached directly. |
| `DB_*`, `REDIS_*` | your servers. Use `127.0.0.1`, not `localhost`, if the server is on the same Windows machine. |
| `PHONEPE_ENV` | `sandbox` for testing, `production` with live keys |
| `PHONEPE_CLIENT_ID` / `_SECRET` / `_VERSION` | from the PhonePe Business dashboard → Developer Settings |
| `PHONEPE_WEBHOOK_USERNAME` / `_PASSWORD` | the credentials you set when creating the webhook (below) |

### PhonePe webhook
In the PhonePe Business dashboard create a webhook to
`https://nirvona.example.com/api/payments/phonepe/callback` and put the username/password
you choose into the two `PHONEPE_WEBHOOK_*` variables. Without it a payment is only
confirmed when the customer comes back to the site; with it the enrolment also completes
if they close the tab right after paying.

## 4. Capacity

Measured on a developer laptop (16 threads, PostgreSQL + Redis + browser all on the
same machine) with the app's full per-request bootstrap, no web server in the way:

| Request | One worker | 8 workers in parallel |
|---|---|---|
| Public catalogue (`/api/packages`) | ~275 req/s | ~750 req/s |
| Student data (`/me/payments`, `/enrollments`, unread count) | ~275–310 req/s | ~670–790 req/s |
| Student dashboard (the heaviest page) | ~146 req/s | ~350 req/s |

Results were the same with 1,000 students / 3,000 payments / 3,000 enrolments loaded, so
the indexes (migration `031`) are doing their job.

**What that means:** 1,000 students all active at once, each clicking every ~4 s, is
roughly 250–500 requests/s including the small ones. A 4-core server with the pool in
`deploy/php-fpm-pool.conf` (32 workers) handles that with headroom, and nginx's 10-second
cache of the public catalogue removes the landing-page rush from PHP entirely. The
Windows `php -S` dev server is single-threaded and adds ~15 ms per request; it is not
representative and is not meant for production.

Tools to re-measure on your own hardware (run from `backend/`):
```bash
php scripts/bench-inproc.php api/students/me/dashboard 300 <student-jwt>   # per-worker speed
node scripts/loadtest.mjs --targets http://127.0.0.1:8101,... --users 500 --seconds 30 --think 3000 --tokens tokens.json
```

### Where you will hit limits first
1. **Postgres connections.** Each PHP worker keeps one persistent connection, so
   `pm.max_children` ≈ connections used. Postgres defaults to 100; if you run several
   servers or more than ~80 workers, put **PgBouncer** (transaction pooling) in front and
   set `DB_PERSISTENT=false`.
2. **Login bursts.** Passwords are hashed with bcrypt (~60–70 ms of CPU each on purpose).
   500 students logging in within seconds is ~30 CPU-seconds of work, so logins may take a
   few seconds at the exact start of an exam. Stagger start times, or add cores.
3. **Redis** is used for rate limiting, the circuit breaker and cached PhonePe tokens. If it
   is unreachable the API keeps working (rate limiting turns off) rather than failing.

## 5. Security checklist (all implemented; verify after deploying)

```bash
php backend/scripts/security-smoke.php https://nirvona.example.com   # ~90 attack attempts; must print ALL CHECKS PASSED
node scripts/check-links.mjs                                         # no broken internal links
```
* Every per-person endpoint is authenticated and takes the student id from the signed
  token, never the URL. Editing an ID in the address bar returns nothing.
* `/admin/*` needs an admin token; the admin screens also refuse to render for a student.
* Tokens are signed HS256 with your secret (algorithm pinned; `alg:none`, tampered and
  expired tokens are rejected). Deactivating a student signs them out immediately.
* Login is limited per account (10 / 15 min) as well as per IP, so guessing one
  password from many addresses is stopped. Sign-up and payment creation are limited too.
* SQL uses bound parameters; column names from request bodies are validated.
* Responses carry `nosniff`, `X-Frame-Options: DENY`, a locked-down CSP, HSTS (HTTPS) and
  `no-store` for anything private. The frontend CSP allows scripts only from your own origin.
* PhonePe payments are confirmed server-to-server (never trusting the browser), for the
  exact expected amount, and enrol exactly once.

Rotate `JWT_SECRET`, the PhonePe secret and the webhook password if they are ever pasted
into chat, email or a ticket.

## 6. Deploy routine
```bash
git pull && (cd backend && composer install --no-dev -o --classmap-authoritative && php migrate.php)
npm ci && VITE_API_BASE_URL=/api npm run build && rsync -a --delete dist/ /var/www/nirvona/dist/
sudo systemctl reload php8.2-fpm
```
Back up PostgreSQL daily (`pg_dump`) and test a restore.
