# syntax=docker/dockerfile:1.6
# Navuuna staging on Fly.io. FrankenPHP is a modern PHP application server
# built on Caddy — handles concurrent requests, keeps workers warm across
# requests, and comes preconfigured for Laravel at /app/public.
FROM dunglas/frankenphp:1-php8.4-alpine

# PostgreSQL client is only for `psql` in-container debugging.
RUN apk add --no-cache postgresql-client curl

# install-php-extensions is bundled in the frankenphp image.
RUN install-php-extensions \
        pdo_pgsql \
        pgsql \
        zip \
        bcmath \
        gd \
        intl \
        opcache

# Composer is bundled too, but grab a pinned version for reproducibility.
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Prime dependency layer before copying app code so code changes don't
# invalidate composer install cache.
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --no-scripts

COPY . .

RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Tuned opcache — sane defaults for a small container.
RUN { \
      echo 'opcache.enable=1'; \
      echo 'opcache.enable_cli=1'; \
      echo 'opcache.memory_consumption=128'; \
      echo 'opcache.max_accelerated_files=10000'; \
      echo 'opcache.validate_timestamps=0'; \
      echo 'realpath_cache_size=4096K'; \
      echo 'realpath_cache_ttl=600'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

# FrankenPHP's default Caddyfile at /etc/caddy/Caddyfile serves /app/public
# via php_server, exactly the pattern Laravel needs.
ENV SERVER_NAME=":8080"
EXPOSE 8080

# Root is required so Caddy can bind :8080; FrankenPHP drops privileges to
# www-data internally for the PHP workers.
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
