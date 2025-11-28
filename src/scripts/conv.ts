import type {Coord, CoordStr} from "@/model/base.ts";

export function strLatLong(crd: Coord): CoordStr {
  const degLat = crd.lat;
  const lat = (degLat < 0 ? "S" : "N") + degreesString(degLat);
  const degLong = crd.long;
  const long = (degLong < 0 ? "W" : "E") + degreesString(degLong);
  return {lat, long}
}

export function degreesString(degrees: number): string {
  const degInt = degrees >> 0;
  const min = ((degrees - degInt) * 60).toFixed(3);
  const deg = degInt.toFixed(0);
  return deg + "\xb0" + min + "'";
}
