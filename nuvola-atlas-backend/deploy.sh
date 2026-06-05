#!/usr/bin/env bash
#
# Forge deploy script for the Nuvola Atlas backend.
#
# Paste this into the Forge UI under "Application > Deploy Script" (or run it
# from a Forge "Quick Deploy" hook). Forge runs the script as the `forge` user
# in $FORGE_SITE_PATH (the repo root, NOT the backend subdir), so this script
# cd's into nuvola-atlas-backend/ before doing any work.
#
# The script is idempotent — re-running it on an already-deployed commit only
# re-runs the cache primer + php-fpm reload, which is safe.
#
# Required Forge env (set in Application > Environment):
#   FORGE_PHP            e.g. /usr/bin/php8.3
#   FORGE_COMPOSER       e.g. /usr/local/bin/composer
#   FORGE_PHP_FPM        e.g. php8.3-fpm
#   FORGE_SITE_BRANCH    main
#
# Required app env (in Forge "Environment" tab — see .env.production.example):
#   APP_ENV=production, APP_DEBUG=false, real DB_*, REDIS_*, REVERB_*, etc.

set -euo pipefail

BACKEND_DIR="nuvola-atlas-backend"

# Forge already ran `git pull` before invoking this script when "Quick Deploy"
# is on. If you trigger deploys manually, uncomment the line below.
# git pull origin "${FORGE_SITE_BRANCH:-main}"

cd "$BACKEND_DIR"

echo "──[1/7] composer install (prod, optimised)"
"$FORGE_COMPOSER" install \
    --no-interaction \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader

echo "──[2/7] put app in maintenance for migrations"
"$FORGE_PHP" artisan down --render="errors::503" --retry=15 || true
trap '"$FORGE_PHP" artisan up || true' EXIT

echo "──[3/7] run migrations"
"$FORGE_PHP" artisan migrate --force

echo "──[4/7] prime caches"
"$FORGE_PHP" artisan config:cache
"$FORGE_PHP" artisan route:cache
"$FORGE_PHP" artisan view:cache
"$FORGE_PHP" artisan event:cache

echo "──[5/7] bring app back up before reloading workers"
"$FORGE_PHP" artisan up
trap - EXIT

echo "──[6/7] tell queue + reverb workers to restart"
"$FORGE_PHP" artisan queue:restart
"$FORGE_PHP" artisan reverb:restart || true

echo "──[7/7] reload php-fpm (flock guards against overlapping deploys)"
(
    flock -w 10 9 || { echo "another deploy holds the lock; skipping fpm reload"; exit 0; }
    sudo -S service "$FORGE_PHP_FPM" reload
) 9>/tmp/fpmlock

echo "── deploy complete: $(git rev-parse --short HEAD)"
