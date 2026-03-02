//
// Math and Utility functions for Falcon BMS Interactive Maps
//
// This file should not depend on anything else excpet core JS datatypes and functions
//
import type {Coord, Point, Vector} from "@/model/base.ts";
import proj4 from "proj4";

export const FeetToMeters = 0.30488
export const FtPerNM = 6076.12

const wgs84 = "EPSG:4326"

/**
 * Converts Falcon BMS X/Y (usually in feet) to WGS84 lat/long using the theater's proj4 string.
 *
 * IMPORTANT:
 * - proj4 expects coordinates in meters as [x, y] and returns [lon, lat]
 */
export function feetToLatLong(proj: string, pos: Point): Coord {
  const xm = pos.x * FeetToMeters
  const ym = pos.y * FeetToMeters
  const [lon, lat] = proj4(proj, wgs84, [xm, ym]) as [number, number];
  return {lat, long: lon};
}

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

export function isPointOnLine(p1: Point, p2: Point, p: Point, threshold: number): boolean {
  const t2 = threshold * threshold

  const abx = p2.x - p1.x
  const aby = p2.y - p1.y
  const apx = p.x - p1.x
  const apy = p.y - p1.y

  const abLen2 = abx * abx + aby * aby

  // Degenerate segment (p1 === b): treat as "near the point p1"
  if (abLen2 === 0) {
    const dx = p.x - p1.x
    const dy = p.y - p1.y
    return dx * dx + dy * dy <= t2
  }

  // Project p onto the segment, clamped to [0, 1]
  let t = (apx * abx + apy * aby) / abLen2
  if (t < 0) t = 0
  else if (t > 1) t = 1

  const closestX = p1.x + t * abx
  const closestY = p1.y + t * aby

  const dx = p.x - closestX
  const dy = p.y - closestY
  return dx * dx + dy * dy <= t2
}

export function isPointOnCircle(ctr: Point, rad: number, p: Point, threshold: number): boolean {
  const r = Math.abs(rad)
  const dx = p.x - ctr.x
  const dy = p.y - ctr.y
  const d = Math.sqrt(dx * dx + dy * dy)
  return Math.abs(d - r) <= Math.abs(threshold)
}

/**
 * Checks whether point `p` is within `threshold` distance from the perimeter of a rotated ellipse.
 *
 * Ellipse is defined by:
 *  - center `ctr`
 *  - major radius `majorRad` (semi-major axis length)
 *  - minor radius `minorRad` (semi-minor axis length)
 *  - rotation `rotation` (radians, counter-clockwise), applied to the ellipse axes
 *
 * Uses an implicit-curve distance approximation:
 *   F(x,y) = x^2/a^2 + y^2/b^2 - 1
 *   distance ≈ |F| / |∇F|
 */
export function isPointOnEllipse(ctr: Point, majorRad: number, minorRad: number, rot: number, p: Point, threshold: number): boolean {
  const rotation = deg2rad(rot)
  const a = Math.abs(majorRad)
  const b = Math.abs(minorRad)
  const t = Math.abs(threshold)

  // Degenerate ellipse: treat as "near the center"
  if (a === 0 || b === 0) {
    const dx0 = p.x - ctr.x
    const dy0 = p.y - ctr.y
    return Math.sqrt(dx0 * dx0 + dy0 * dy0) <= t
  }

  // Translate into ellipse-centered coordinates
  const dx = p.x - ctr.x
  const dy = p.y - ctr.y

  // Un-rotate the point (equivalent to rotating the ellipse by +rotation)
  const c = Math.cos(-rotation)
  const s = Math.sin(-rotation)
  const x = dx * c - dy * s
  const y = dx * s + dy * c

  const a2 = a * a
  const b2 = b * b

  // Implicit function value: 0 on the ellipse
  const F = (x * x) / a2 + (y * y) / b2 - 1

  // Gradient magnitude for distance approximation
  const gx = (2 * x) / a2
  const gy = (2 * y) / b2
  const grad = Math.sqrt(gx * gx + gy * gy)

  // Very close to center (or numerical edge case)
  if (grad === 0) return false

  const approxDist = Math.abs(F) / grad
  return approxDist <= t
}

export function isPointInRect(ctr: Point, width: number, height: number, rot: number, p: Point): boolean {
  const dx = p.x - ctr.x
  const dy = p.y - ctr.y
  const rad = deg2rad(-rot)
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const localX = dx * c - dy * s
  const localY = dx * s + dy * c
  return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2
}

export function isPointOnRect(ctr: Point, width: number, height: number, rot: number, p: Point, threshold: number): boolean {
  const pts = rectCornersFromCenter(ctr, width, height, rot)
  return isPointOnLine(pts[0], pts[1], p, threshold) ||
    isPointOnLine(pts[1], pts[2], p, threshold) ||
    isPointOnLine(pts[2], pts[3], p, threshold) ||
    isPointOnLine(pts[3], pts[0], p, threshold);
}

function rectCornersFromCenter(ctr: Point, width: number, height: number, rot: number): [Point, Point, Point, Point] {
  const hw = width / 2
  const hh = height / 2
  const local: [Point, Point, Point, Point] = [{x: -hw, y: -hh}, {x: hw, y: -hh}, {x: hw, y: hh}, {x: -hw, y: hh}]
  const rad = deg2rad(rot)
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return local.map(({x, y}) => ({
    x: ctr.x + x * c - y * s,
    y: ctr.y + x * s + y * c,
  })) as [Point, Point, Point, Point];
}
