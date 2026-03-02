import {describe, expect, it} from "vitest";

import {findMap} from "@/data/map";
import {feetToLatLong} from "@/scripts/math.ts";

function expectClose(actual: number, expected: number, tolerance: number, label: string) {
  expect(
    Math.abs(actual - expected),
    `${label} expected ${expected} got ${actual} (tol=${tolerance})`,
  ).toBeLessThanOrEqual(tolerance);
}

export function ddToDms(dd: number) {
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return {deg, min};
}

describe("bmsXYToLatLong (korea, tmerc)", () => {
    it.each([
      {name: "Gunsan", x: 1418591.342, y: 736355.506, expectedLat: 35.898583, expectedLon: 126.616933},
      {name: "Daegu", x: 2023048.971, y: 733423.213, expectedLat: 35.899383, expectedLon: 128.650733},
      {name: "Wonju", x: 1815163.823, y: 1294929.55, expectedLat: 37.446300, expectedLon: 127.965317},
      {name: "Iwami", x: 2969651.313, y: 315694.795, expectedLat: 34.675300, expectedLon: 131.795450},
      {name: "Samjiyon", x: 1927434.271, y: 2921911.028, expectedLat: 41.905583, expectedLon: 128.405333},
      {name: "Sugamni", x: 2274190.455, y: 2843129.248, expectedLat: 41.675650, expectedLon: 129.675200},
      {name: "Manpo", x: 1365193.271, y: 2643237.451, expectedLat: 41.135050, expectedLon: 126.354883},
    ])("converts $name fixed X,Y to expected Lat/Long ($x, $y)", ({name, x, y, expectedLat, expectedLon}) => {
      const theater = findMap("korea");
      if (!theater) throw new Error("korea theater not found");

      const out = feetToLatLong(theater.projection, {x, y});

      let dmsLat = ddToDms(out.lat);
      let dmsLong = ddToDms(out.long);

      console.log(
        `${name}: ${dmsLong.deg}° ${dmsLong.min.toFixed(3)}' E, ` +
        `${dmsLat.deg}° ${dmsLat.min.toFixed(3)}' N ` +
        `| diff: ${(out.long - expectedLon).toFixed(5)} E, ${(out.lat - expectedLat).toFixed(5)} N`);

      const tol = 0.05
      expectClose(out.lat, expectedLat, tol, "lat");
      expectClose(out.long, expectedLon, tol, "lon");
    });
  }
);
