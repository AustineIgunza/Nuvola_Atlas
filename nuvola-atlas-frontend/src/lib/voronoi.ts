// Clipped-Voronoi tessellation for the Atlas zone choropleth.
//
// Each zone has a single centroid; we turn those 17 points into space-filling
// polygons so the map shows a zone's *area of influence*, not just a pin. The
// cell for a site is the set of points closer to it than to any other site —
// computed as the intersection of half-planes bounded by the perpendicular
// bisectors between that site and every other site, clipped to a bounding box.
//
// Nairobi sits ~1.28° off the equator, so cos(lat) ≈ 0.9997 and lng/lat can be
// treated as a planar grid with negligible distortion — no projection needed.

export type Point = [number, number]; // [lng, lat]
export type Ring = Point[];
export type BBox = [number, number, number, number]; // [minX, minY, maxX, maxY]

export function computeBBox(points: Point[], pad = 0.03): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX - pad, minY - pad, maxX + pad, maxY + pad];
}

// Sutherland–Hodgman clip of a convex ring against the half-plane of points
// nearer to `a` than to `b` (i.e. keep the side of the a–b bisector on `a`).
function clipToBisector(ring: Ring, a: Point, b: Point): Ring {
  // Keep where 2·(b−a)·p ≤ |b|² − |a|²  →  f(p) = n·p − c ≤ 0
  const nx = 2 * (b[0] - a[0]);
  const ny = 2 * (b[1] - a[1]);
  const c = b[0] * b[0] + b[1] * b[1] - (a[0] * a[0] + a[1] * a[1]);
  const f = (p: Point) => nx * p[0] + ny * p[1] - c;

  const out: Ring = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const cur = ring[i];
    const nxt = ring[(i + 1) % n];
    const fc = f(cur);
    const fn = f(nxt);
    const curIn = fc <= 0;
    const nxtIn = fn <= 0;
    if (curIn) out.push(cur);
    if (curIn !== nxtIn) {
      const t = fc / (fc - fn);
      out.push([cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])]);
    }
  }
  return out;
}

// Returns one closed ring (first point repeated at the end) per input site,
// index-aligned with `sites`. Empty ring is possible only for coincident sites.
export function voronoiRings(sites: Point[], bbox?: BBox): Ring[] {
  const [minX, minY, maxX, maxY] = bbox ?? computeBBox(sites);
  const rect: Ring = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];

  return sites.map((site, i) => {
    let ring = rect;
    for (let j = 0; j < sites.length && ring.length; j++) {
      if (j === i) continue;
      ring = clipToBisector(ring, site, sites[j]);
    }
    if (!ring.length) return ring;
    return [...ring, ring[0]]; // close the ring for GeoJSON
  });
}
