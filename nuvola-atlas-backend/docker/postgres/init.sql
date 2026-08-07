-- Create test database
CREATE DATABASE nuvola_atlas_test;
\c nuvola_atlas_test
CREATE EXTENSION IF NOT EXISTS postgis;

-- Fix auth: set md5 password for nuvola user
ALTER USER nuvola WITH PASSWORD 'nuvola_secret';

-- n8n keeps its workflow/credential state in an isolated schema on the same
-- database. n8n runs its own migrations but will not create the schema, and
-- keeping it out of `public` means a `php artisan migrate:fresh` cannot wipe
-- the automation state.
\c nuvola_atlas
CREATE SCHEMA IF NOT EXISTS n8n AUTHORIZATION nuvola;
