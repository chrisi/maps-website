import type {Position, PositionStr} from "@/model/base.ts";

export function strLatLong(pos: Position): PositionStr {
  const degLat = pos.lat;
  const lat = (degLat < 0 ? "S" : "N") + degreesString(degLat);
  const degLong = pos.long;
  const long = (degLong < 0 ? "W" : "E") + degreesString(degLong);
  return {lat, long}
}

export function degreesString(degrees: number): string {
  const degInt = degrees >> 0;
  const min = ((degrees - degInt) * 60).toFixed(3);
  const deg = degInt.toFixed(0);
  return deg + "\xb0" + min + "'";
}
