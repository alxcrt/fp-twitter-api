# Public Twitter course demo

This is intentionally a public demo: anyone can choose an existing display name or create a new one. Names are shared demo identities, not private accounts. Public tweet/user reads and name-only login are preserved by Alex's decision on 24 October 2026. Use demonstration data.

The deployment targets are Coolify and Cloudflare. Node 24 serves a non-root read-only standalone Next.js image. Prisma uses the PostgreSQL adapter and bounded pool; database models and existing IDs are unchanged. The destructive legacy app/db/setup.js helper is retired. Startup never creates, pushes or migrates the production schema.

Set DATABASE_URL (or transitional POSTGRES_URL_NON_POOLING) and a random SESSION_SECRET containing at least 32 bytes through Coolify's protected environment. Database TLS certificates must validate. Changing the key intentionally invalidates old demo tokens. Cookie, Bearer and renewal share the same strict HS256 context/identity/expiry verifier. Invalid tokens become unauthenticated state; this protects token integrity and does not establish private ownership of demo names.

Use Node 24, npm ci --ignore-scripts, npm test, npm run build, npm run lint and npm run typecheck. Build-only runs use an explicit non-routable placeholder URL and do not query a database. TypeScript 6 is the parser-compatible compiler line; the current parser does not support TypeScript 7. ESLint 10 uses current TypeScript and Next plugins directly.

CI creates an isolated PostgreSQL database and exercises the exact hardened image: new/existing name selection, cookie/Bearer controls, malformed/expired/old-key rejection before writes, invalid-cookie renewal, public reads, emoji posting, CORS and the middleware-bypass header. tests/http-contract.mjs mutates only the disposable database and refuses a non-loopback target or missing isolation marker. Never run it against live data. Native migration requires a restored source-data copy before a final writer-paused snapshot/cutover.

Daily patch/minor updates pass the complete gate and immutable exact-main receipt before guarded promotion. Majors remain reviewed. The former Vercel deployment remains until all hostnames, data and rollback are verified; disable its build path only after cutover.
