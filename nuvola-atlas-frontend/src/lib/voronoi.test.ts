import { describe, it, expect } from "vitest";
import { computeBBox, voronoiRings, type Point } from "./voronoi";

const SITES: Point[] = [
  [36.8, -1.27],
  [36.9, -1.3],
  [36.85, -1.22],
  [36.78, -1.33],
  [36.95, -1.24],
];

function dist2(a: Point, b: Point) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

describe("computeBBox", () => {
  it("pads the extent of the input points", () => {
    const [minX, minY, maxX, maxY] = computeBBox(SITES, 0.03);
    expect(minX).toBeCloseTo(36.78 - 0.03);
    expect(minY).toBeCloseTo(-1.33 - 0.03);
    expect(maxX).toBeCloseTo(36.95 + 0.03);
    expect(maxY).toBeCloseTo(-1.22 + 0.03);
  });
});

describe("voronoiRings", () => {
  it("returns one closed ring per site", () => {
    const rings = voronoiRings(SITES);
    expect(rings).toHaveLength(SITES.length);
    for (const ring of rings) {
      expect(ring.length).toBeGreaterThanOrEqual(4);
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    }
  });

  it("every cell vertex is nearest to its own site", () => {
    const rings = voronoiRings(SITES);
    rings.forEach((ring, i) => {
      for (const v of ring) {
        const dOwn = dist2(v, SITES[i]);
        SITES.forEach((other, j) => {
          if (j === i) return;
          expect(dOwn).toBeLessThanOrEqual(dist2(v, other) + 1e-12);
        });
      }
    });
  });

  it("clips every cell to the bounding box", () => {
    const bbox = computeBBox(SITES);
    const [minX, minY, maxX, maxY] = bbox;
    for (const ring of voronoiRings(SITES, bbox)) {
      for (const [x, y] of ring) {
        expect(x).toBeGreaterThanOrEqual(minX - 1e-9);
        expect(x).toBeLessThanOrEqual(maxX + 1e-9);
        expect(y).toBeGreaterThanOrEqual(minY - 1e-9);
        expect(y).toBeLessThanOrEqual(maxY + 1e-9);
      }
    }
  });

  it("a single site owns the whole padded box", () => {
    const [ring] = voronoiRings([[36.8, -1.27]]);
    expect(ring).toHaveLength(5); // 4 rect corners + closing point
  });
});
