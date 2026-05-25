-- Create test database
CREATE DATABASE nuvola_atlas_test;
\c nuvola_atlas_test
CREATE EXTENSION IF NOT EXISTS postgis;

-- Fix auth: set md5 password for nuvola user
ALTER USER nuvola WITH PASSWORD 'nuvola_secret';
