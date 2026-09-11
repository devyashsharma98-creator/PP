# Database-backed tests

`src/**/*.db.test.ts` run against a real Postgres. They are excluded from the
default `vitest` suite, so `npm test` needs no database.

## Disposable local database

The app talks to Postgres over Neon's HTTP protocol, so a plain Postgres
container needs the Neon HTTP proxy in front of it:

```bash
docker run -d --name pp-verify-db \
  -e POSTGRES_USER=pp -e POSTGRES_PASSWORD=verify -e POSTGRES_DB=pragyapravah \
  -p 55432:5432 postgres:16

docker run -d --name pp-neon-proxy -p 54330:4444 \
  -e PG_CONNECTION_STRING="postgres://pp:verify@host.docker.internal:55432/pragyapravah" \
  ghcr.io/timowilhelm/local-neon-http-proxy:main
```

Create `.env.local` (gitignored — never point this at a shared database):

```
DATABASE_URL=postgres://pp:verify@127.0.0.1:54330/pragyapravah
NEON_LOCAL_HTTP_PROXY=true
JWT_SECRET=<any 32+ character string, local only>
```

Push the schema through the direct Postgres port, since drizzle-kit does not
speak the HTTP protocol:

```bash
DATABASE_URL_UNPOOLED="postgres://pp:verify@127.0.0.1:55432/pragyapravah" npx drizzle-kit push
```

## Running

```bash
npx dotenv -e .env.local -- npx vitest run --config vitest.integration.config.ts
```

Without `DATABASE_URL` the suites skip rather than fail.

Seed scripts build their own client, so they need the proxy shim preloaded:

```bash
npx dotenv -e .env.local -- npx tsx --import ./test/neon-local-http-proxy.mjs src/db/seed.ts
```

## Teardown

```bash
docker rm -f pp-verify-db pp-neon-proxy
```
