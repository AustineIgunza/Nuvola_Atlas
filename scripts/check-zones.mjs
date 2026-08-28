#!/usr/bin/env node
//
// The 17 Nairobi sub-counties are declared in three places. This fails the
// build when they stop agreeing.
//
//   zones.json                                    the registry (source of truth)
//   nuvola-atlas-backend/database/seeders/ZoneSeeder.php     seeds the dev DB
//   nuvola-atlas-frontend/public/data/nairobi-subcounties.geojson   boundary file
//
// The GeoJSON is checked even though nothing currently loads it — the atlas
// builds its shapes at runtime from Voronoi cells around the zones.json
// centroids. It is checked precisely because it is unattended: when real
// boundaries replace those placeholder rectangles and the file is finally
// wired up, its slugs must already agree rather than being reconciled then.
//
// Why a comparison rather than generation: pillars.json can emit typed
// bindings because its consumers are plain data structures. These two are not
// — one is a PHP seeder carrying fixture pillar values alongside the zone
// definitions, the other a GeoJSON FeatureCollection with geometry. Generating
// either would mean owning content this registry has no business owning.
// Comparing costs one script and catches the same drift.
//
// Slug, display name and zone count are compared. Centroids are NOT: the
// registry marks them approximate (see centroid_provenance) and the seeder is
// where they currently live, so requiring equality would freeze a placeholder
// into a contract.
//
//   node scripts/check-zones.mjs
//
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const REGISTRY = "zones.json";
const SEEDER = "nuvola-atlas-backend/database/seeders/ZoneSeeder.php";
const GEOJSON = "nuvola-atlas-frontend/public/data/nairobi-subcounties.geojson";

const registry = JSON.parse(read(REGISTRY));
const expected = new Map(registry.zones.map((z) => [z.key, z.display_name]));

// `'westlands' => ['Westlands', 36.8048, -1.2673, 4, [`
const seeder = new Map(
  [...read(SEEDER).matchAll(/'([a-z-]+)' => \['([^']+)',/g)].map((m) => [m[1], m[2]]),
);

const geojson = new Map(
  JSON.parse(read(GEOJSON)).features.map((f) => [f.properties.id, f.properties.name]),
);

const problems = [];

function compare(label, actual) {
  for (const [key, name] of expected) {
    if (!actual.has(key)) {
      problems.push(`${label}: missing zone '${key}'`);
    } else if (actual.get(key) !== name) {
      problems.push(
        `${label}: '${key}' is named '${actual.get(key)}', registry says '${name}'`,
      );
    }
  }
  for (const key of actual.keys()) {
    if (!expected.has(key)) problems.push(`${label}: '${key}' is not in ${REGISTRY}`);
  }
}

// A parse that silently matches nothing would pass every comparison below, so
// prove the extraction worked before trusting what it found.
if (seeder.size === 0) problems.push(`${SEEDER}: parsed zero zones — the fixture format changed`);
if (geojson.size === 0) problems.push(`${GEOJSON}: parsed zero features`);

compare(SEEDER, seeder);
compare(GEOJSON, geojson);

// boundaries.py raises BoundaryCountError on anything but 17; keep the
// registry honest about the same invariant rather than only the pipeline.
if (expected.size !== 17) {
  problems.push(`${REGISTRY}: declares ${expected.size} zones, Nairobi has 17`);
}

if (problems.length === 0) {
  console.log(`zone registry is in sync (${expected.size} sub-counties, 3 sources)`);
  process.exit(0);
}

console.error("zone registry check: FAIL\n");
for (const p of problems) console.error(`  ${p}`);
console.error(`
The 17 sub-counties are declared in ${REGISTRY}, seeded by ZoneSeeder.php and
drawn from nairobi-subcounties.geojson. All three must agree — a slug that
drifts in one of them drops a sub-county from the map, the seed, or both.
Fix the outlier; ${REGISTRY} is the source of truth.`);
process.exit(1);
