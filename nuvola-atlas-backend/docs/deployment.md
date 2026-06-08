# Backend deployment

> **This file is a stub.** The authoritative deploy doc lives at the repo
> root: [`docs/ops/deploy.md`](../../docs/ops/deploy.md). It covers
> Laravel Forge + DigitalOcean + Supabase, the stack we actually use.

## Local dev quick reference

```bash
# Boot the local docker postgres+postgis test DB
cd nuvola-atlas-backend
docker compose up -d postgres

# PHP deps + key + migrate + seed
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed

# Serve
php artisan serve
```

Default seeded admin: `austine@nuvola.dev` / `password`.

Frontend dev server runs from `../nuvola-atlas-frontend`:

```bash
cd ../nuvola-atlas-frontend
npm ci
npm run dev   # http://localhost:5173
```

## Production

See [`docs/ops/deploy.md`](../../docs/ops/deploy.md). The earlier
Dockerfile + `docker-compose.prod.yml` + Railway path that lived here
was removed on 2026-06-08 — it never matched the chosen stack.

Related runbooks:

- [`docs/ops/rollback.md`](../../docs/ops/rollback.md)
- [`docs/ops/incident-response.md`](../../docs/ops/incident-response.md)
- [`docs/ops/secret-rotation.md`](../../docs/ops/secret-rotation.md)
