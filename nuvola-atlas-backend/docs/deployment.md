# Nuvola Atlas — Deployment Guide

## Local Development

### Prerequisites
- PHP 8.4+ with extensions: pdo_pgsql, pgsql, bcmath
- Composer 2+
- Docker (for PostgreSQL)
- Node.js 20+ with pnpm (for frontend)

### Setup

```bash
# 1. Start PostgreSQL
cd nuvola-atlas-backend
docker compose up -d

# 2. Install PHP dependencies
composer install

# 3. Configure environment
cp .env.example .env
php artisan key:generate

# 4. Run migrations and seed
php artisan migrate:fresh --seed

# 5. Start the API server
php artisan serve

# 6. Start the frontend (separate terminal)
cd ../nuvola-atlas-frontend
pnpm install
pnpm dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- PostgreSQL: localhost:5434

**Default credentials:** `austine@nuvola.dev` / `password`

### Running Tests

```bash
# Backend
cd nuvola-atlas-backend
php artisan test              # PHPUnit
vendor/bin/pint --test        # Code style
vendor/bin/phpstan analyse    # Static analysis

# Frontend
cd nuvola-atlas-frontend
pnpm test                     # Vitest
pnpm typecheck                # TypeScript
```

## Docker Production Deployment

```bash
cd nuvola-atlas-backend

# Create production .env
cp .env.example .env
# Edit .env: set APP_ENV=production, APP_DEBUG=false, real DB password, etc.

# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force

# Seed (first time only)
docker compose -f docker-compose.prod.yml exec app php artisan db:seed
```

## VPS Deployment (Manual)

### Server Setup

```bash
# Install PHP 8.4, PostgreSQL 16 + PostGIS, Nginx, Certbot
sudo apt update
sudo apt install php8.4-fpm php8.4-pgsql php8.4-bcmath php8.4-xml php8.4-mbstring \
    postgresql-16 postgresql-16-postgis-3 nginx certbot python3-certbot-nginx

# Clone the repo
cd /var/www
git clone https://github.com/AustineIgunza/Nuvola_Atlas.git nuvola-atlas

# Install Composer
cd nuvola-atlas/nuvola-atlas-backend
composer install --no-dev --optimize-autoloader

# Configure
cp .env.example .env
php artisan key:generate
# Edit .env with production values

# Migrate
php artisan migrate --force
php artisan db:seed

# Cache config
php artisan config:cache
php artisan route:cache
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/nuvola-atlas/nuvola-atlas-backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com
```

### Queue Worker (systemd)

Create `/etc/systemd/system/nuvola-queue.service`:

```ini
[Unit]
Description=Nuvola Atlas Queue Worker
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/nuvola-atlas/nuvola-atlas-backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable nuvola-queue
sudo systemctl start nuvola-queue
```

## CI/CD

GitHub Actions workflows are configured:

- **CI** (`.github/workflows/ci.yml`): Runs on every push/PR to main. Tests backend (PHPUnit, Pint, PHPStan) and frontend (Vitest, TypeScript, build).
- **Deploy** (`.github/workflows/deploy.yml`): Manual trigger. SSH into VPS, pull latest code, install deps, migrate, cache config, restart queue.

### Required GitHub Secrets for Deploy

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | VPS IP or hostname |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Private SSH key |

## Environment Variables

See `.env.example` for all available variables. Critical production settings:

| Variable | Production Value |
|----------|-----------------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `DB_PASSWORD` | Strong random password |
| `SANCTUM_TOKEN_EXPIRATION` | `480` (minutes) |
| `CORS_ALLOWED_ORIGINS` | Your frontend domain |
