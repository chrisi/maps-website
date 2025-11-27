//
// Math and Utility functions for Falcon BMS Interactive Maps
//
// This file should not depend on anything else excpet core JS datatypes and functions
//
import type {Coord, Point, Vector} from "@/model/base.ts";

export const PX2NM = 6.95; // Based on 3840 for maps

// Given two points return a vector with length and direction
export function vector(point1: Point, point2: Point): Vector {
  const mag = Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  const dir = Math.atan2(point2.x - point1.x, point2.y - point1.y);
  return {mag, dir};
}

// Compute the distance between two points
export function distance(point1: Point, point2: Point): number {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

// Given a Vector
export function vec2XY(vector: Vector): Point {
  const x = vector.mag * Math.cos(vector.dir);
  const y = vector.mag * Math.sin(vector.dir);
  return {x: x, y: y};
}

//TODO: why the additional checks?
// Convert Radians to Degrees Heading
export function rad2deg(rad: number): number {
  let degrees = Math.round(Math.abs((rad * 57.2958) - 180));
  if (degrees == 0) degrees = 360;
  return degrees;
}

// Convert Degrees to radians
export function deg2rad(deg: number): number {
  return deg / 57.2958;
}

// Determine midpoint bewteen two points
export function midpoint(point1: Point, point2: Point): Point {
  return {x: (point1.x + point2.x) / 2, y: (point1.y + point2.y) / 2};
}

export function offsetToLatLon(crd: Coord, xOffsetFt: number, yOffsetFt: number): Coord {
  // Constants
  const R = 6378137; // Earth radius in meters
  const deg2rad = Math.PI / 180; // Degrees to radians conversion
  const ftToM = 0.3048; // Feet to meters conversion
  const metersPerDegreeLat = 111120; // Approximate meters per degree of latitude

  // Convert offsets from feet to meters with latitude correction
  const xM = xOffsetFt * ftToM;
  const yM = yOffsetFt * ftToM * 1.065; // Empirical correction for 0.910716° latitude error

  // Estimate target latitude for longitude correction
  const deltaLat = yM / metersPerDegreeLat; // Approximate latitude change in degrees
  const latEst = crd.lat + deltaLat; // Estimated target latitude
  const scale = (1 / Math.cos(latEst * deg2rad)) * 1.002; // Longitude scale with correction for 0.710367° error

  const xMCorrected = xM * scale;

  // Convert origin (lat0, lon0) to Web Mercator coordinates
  const x0 = R * crd.long * deg2rad;
  const y0 = R * Math.log(Math.tan(Math.PI / 4 + crd.lat * deg2rad / 2));

  // Apply corrected offsets
  const x = x0 + xMCorrected;
  const y = y0 + yM;

  // Convert back to latitude and longitude
  const long = x / (R * deg2rad);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) / deg2rad;

  return {lat, long};
}

export function map2LatLong(datum: Coord, loc: Point): Coord {
  const KM_TO_FT = 3280.8399;
  const x = loc.x - 512 * KM_TO_FT;
  const y = loc.y - 512 * KM_TO_FT;
  const result = offsetToLatLon(datum, x, y);
  return {lat: result.lat, long: result.long};
}

//
// Basic Flight Computer stuff
//

// TOS is stored in hours on start day
export function tosTime(hours: number): string {
  hours = hours % 24;
  const hrs = hours >> 0;
  const min = ((hours - hrs) * 60) >> 0;
  const sec = ((((hours - hrs) * 60) - min) * 60) >> 0;
  return `${hrs.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// TOS get the days
export function tosDay(hours: number): number {
  return (hours / 24) >> 0;
}

// Get TOS hours from day and time string
export function tosHours(day: string, time: string): number {
  const data = time.split(":");
  return (24 * parseInt(day)) + parseInt(data[0]!) + (parseInt(data[1]!) / 60) + (parseInt(data[2]!) / 3600);
}

/* Calculate ETA from Start time, distance and ground speed */
export function getFlightHours(gs: number, dist: number): number {
  return (dist / gs);
}

/* Flight speed */
export function getGroundSpeed(duration: number, dist: number): number {
  return (dist / duration);
}

// gs = ground speed (distance per hour)
// dist = distance (same distance unit as gs)
// returns time in minutes //TODO: check if this is correct
export function flightTime(gs: number, dist: number) {
  if (gs === 0) return Infinity; // avoid divide-by-zero
  const hours = dist / gs;
  return hours * 60 * 60;
}

export function getFlightETA(startTime: number, gs: number, dist: number) {
  return startTime + flightTime(gs, dist);
}

export function getFlightSpeed(timeMs: number, dist: number) {
  const hours = timeMs / (1000 * 60 * 60);
  if (hours === 0) return 0;  // Avoid divide-by-zero
  return dist / hours;
}

export function getSpeedForATA(startTime: number, endTime: number, dist: number) {
  return getFlightSpeed(endTime - startTime, dist);
}

// TAS to Mach number
export function tas2mach(tas: number, oat: number): number {
  // Compute Sonic Speed for OAT in Kelvin
  const temp = oat + 273.15;
  const spd = tas / 1.944; // knots to m/s
  const a = Math.sqrt(1.4 * 287.053 * temp);
  return (spd / a);
}
