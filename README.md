# lead-distribution-backend

Node.js/TypeScript backend for the lead distribution platform. See `CLAUDE.md` (local, not
committed) for architecture and conventions.

## Local development

```bash
npm install
cp .env.example .env   # fill in real values, .env is gitignored
npx prisma generate
npm run migrate:dev
npm run seed
npm run dev
```

`GET /api/health` should return `{ "status": "ok" }`.

## Deployment (PM2)

Run on the VPS, as the deploy user:

```bash
git clone git@github.com:jjaguilar08/lead-distribution-backend.git
cd lead-distribution-backend
npm install
cp .env.example .env    # fill in the production DATABASE_URL, JWT_SECRET, ADMIN_EMAIL/PASSWORD
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js
pm2 save
```

`ecosystem.config.js` runs the compiled app (`dist/index.js`) under the name
`lead-distribution-backend`, with `PORT=8568`.

To redeploy after a change:

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart lead-distribution-backend
```

Verify the deploy:

```bash
curl localhost:8568/api/health
# {"status":"ok"}
```
