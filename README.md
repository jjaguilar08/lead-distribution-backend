# lead-distribution-backend

Node.js/TypeScript backend for the lead distribution platform. See `CLAUDE.md` (local, not
committed) for architecture and conventions.

## Prerequisites

- Node.js (LTS) and npm
- Access to the MySQL database this project talks to. It isn't exposed publicly — only
  reachable via SSH (an SSH tunnel for local dev, or directly over `127.0.0.1` from the VPS
  itself once deployed there). Real host/user/port details live in `infra.local.md`
  (gitignored, not in this repo's history) rather than here.

## Clone and install

```bash
git clone git@github.com:jjaguilar08/lead-distribution-backend.git
cd lead-distribution-backend
npm install
```

## Environment variables

```bash
cp .env.example .env
```

Fill in real values for every variable listed in `.env.example`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string, `mysql://user:password@host:port/db` |
| `PORT` | Port the app listens on |
| `JWT_SECRET` | Signing secret for the auth JWT |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `1d`) |
| `ADMIN_EMAIL` | Seeded admin user's login email |
| `ADMIN_PASSWORD` | Seeded admin user's login password |

`.env` is gitignored and must never be committed.

## Database setup and migrations

The MySQL user this project runs as only has grants on its own database — not
`CREATE DATABASE` — so `prisma migrate dev` doesn't work here; it needs a shadow database to
diff against. Everything goes through the no-shadow-DB flow instead.

**First-time setup against an empty database:**

```bash
npx prisma generate
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script \
  > /tmp/init.sql
npx prisma db execute --file /tmp/init.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20260803123538_init
npm run seed
```

(This is already done for the current database — `prisma/migrations/20260803123538_init` is
committed. You only need this if you're pointing at a fresh, empty database.)

**Adding a new migration later** (after editing `prisma/schema.prisma`):

```bash
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_<name>
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/<timestamp>_<name>/migration.sql
npx prisma db execute --file prisma/migrations/<timestamp>_<name>/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied <timestamp>_<name>
npx prisma generate
```

Commit the new `prisma/migrations/<timestamp>_<name>/` directory. From there,
`npx prisma migrate deploy` (used in production, see below) picks it up normally —
`migrate deploy` never needs a shadow database, only `migrate dev` does.

**Reaching the database for local dev:** since MySQL isn't publicly exposed, open an SSH
tunnel first (see `infra.local.md` for the real host/user):

```bash
ssh -L 13306:127.0.0.1:3306 <ssh-user>@<vps-host>
```

then point `DATABASE_URL` in `.env` at `127.0.0.1:13306` for the duration of the tunnel.

## Running locally

```bash
npm run dev
```

`GET /api/health` should return `{ "status": "ok" }`.

## Deployment (PM2)

The app is deployed on the VPS and run under PM2, bound to `127.0.0.1` only (see
`src/index.ts` — defense-in-depth, since the security group is the primary control but isn't
inspectable from this box). There is no public HTTP access; reach it only via SSH.

**Initial deploy, on the VPS as the deploy user:**

```bash
git clone git@github.com:jjaguilar08/lead-distribution-backend.git
cd lead-distribution-backend
npm install
cp .env.example .env    # fill in the production DATABASE_URL, JWT_SECRET, ADMIN_EMAIL/PASSWORD
npx prisma migrate deploy
npx prisma generate
npm run build
npm run seed
pm2 start ecosystem.config.js
pm2 save
```

`ecosystem.config.js` runs the compiled app (`dist/index.js`) under the name
`lead-distribution-backend`, with `PORT=8568`.

**To redeploy after a change:**

```bash
git pull
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart lead-distribution-backend
```

## Checking logs

```bash
pm2 logs lead-distribution-backend                          # tail stdout/stderr
pm2 logs lead-distribution-backend --lines 200 --nostream    # last 200 lines, no follow
pm2 status                                                    # process state, restarts, uptime
```

## Accessing the deployed app

The app only listens on `127.0.0.1:8568` on the VPS — there's no public URL. To reach it:

**From the VPS itself** (e.g. over an SSH session):

```bash
curl localhost:8568/api/health
# {"status":"ok"}
```

**From a dev machine**, open a local port-forward first:

```bash
ssh -L 8568:127.0.0.1:8568 <ssh-user>@<vps-host>
curl localhost:8568/api/health
```
