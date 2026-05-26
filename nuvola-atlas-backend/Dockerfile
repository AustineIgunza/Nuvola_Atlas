# ─── Stage 1: Build frontend assets ───────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app

ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=${VITE_MAPBOX_TOKEN}

COPY package.json package-lock.json ./
RUN npm ci
COPY vite.config.js tsconfig.json ./
COPY resources ./resources
RUN npm run build

# ─── Stage 2: Install PHP dependencies ───────────────────
FROM composer:2 AS backend
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --optimize

# ─── Stage 3: Production image ───────────────────────────
FROM php:8.3-cli-alpine

RUN apk add --no-cache \
    postgresql-dev \
    libpq \
    && docker-php-ext-install pdo_pgsql pgsql bcmath pcntl

WORKDIR /var/www/html

# Copy PHP app with composer deps
COPY --from=backend /app /var/www/html

# Copy built frontend assets (overwrite any dev artifacts)
COPY --from=frontend /app/public/build /var/www/html/public/build

# Ensure storage and cache dirs exist with correct permissions
RUN mkdir -p storage/framework/{cache,sessions,views} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Railway injects PORT env var
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stderr
ENV SESSION_DRIVER=cookie

EXPOSE 8000

CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
