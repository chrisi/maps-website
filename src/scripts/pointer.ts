import {Mode} from "@/model/mode.ts";
import type {Coord, CoordStr, Point} from "@/model/base.ts";
import {pinia} from "@/plugins/pinia.ts";
import {useStateStore} from "@/stores/state.ts";
import {properties} from "@/scripts/properties.ts";

const state = useStateStore(pinia)

type PointerPane = {
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject
  ) => void;
};

export function activatePointerEvents(target?: HTMLElement) {
  const pane: PointerPane = (target ?? window) as PointerPane;
  pane.addEventListener('mousedown', mouseDownHandler as EventListener);
  pane.addEventListener('mousemove', mouseMoveHandler as EventListener);
  pane.addEventListener('mouseup', mouseUpHandler as EventListener);
  pane.addEventListener('wheel', wheelHandler as EventListener, {passive: false});
}

export function deactivatePointerEvents(target?: HTMLElement) {
  const pane: PointerPane = (target ?? window) as PointerPane;
  pane.removeEventListener('mousedown', mouseDownHandler as EventListener);
  pane.removeEventListener('mousemove', mouseMoveHandler as EventListener);
  pane.removeEventListener('mouseup', mouseUpHandler as EventListener);
  pane.removeEventListener('wheel', wheelHandler as EventListener);
}

let pointerPanStart = {x: 0, y: 0};

//filters out events from certain elements
function peventDefaultFiltered(e: Event) {
  const elem = e.target as HTMLElement;
  if (elem.classList.contains("suspend-prevent")) return;
  e.preventDefault()
}

const limits = {
  zoom_max: 2.5,
  zoom_min: 0.5,
  wheel_rate_hz: 20
}

let wheel_enabled = true;

export const zoom = (dir: number) => {
  if (Math.sign(dir) > 0)
    properties.zoom = properties.zoom / properties.zoomSpeed;
  else
    properties.zoom = properties.zoom * properties.zoomSpeed;
  if (properties.zoom < limits.zoom_min) properties.zoom = limits.zoom_min;
  if (properties.zoom > limits.zoom_max) properties.zoom = limits.zoom_max;
}

// Allow zooming with the mouse but limit it to a set wheel rate
// See Limiters (20 hz) and set discrete steps
const wheelHandler = function (e: WheelEvent) {
  e.preventDefault();
  // Ensure zoom stays within limits and apply rounding to avoid floating-point drift
  if (wheel_enabled) {
    zoom(e.deltaY);
    scaleView({x: e.clientX, y: e.clientY});
    // saveSettings();
    // refreshCanvas();
    wheel_enabled = false;
    setTimeout(function () {
      wheel_enabled = true;
    }, (1 / limits.wheel_rate_hz) * 1000);
  }
}

const mouseDownHandler = function (e: MouseEvent) {
  peventDefaultFiltered(e)
  switch (state.mode) {
    case Mode.Move:
      if (properties.mouseDown) break;
      const ofs = document.scrollingElement!;
      pointerPanStart = {x: e.clientX + ofs.scrollLeft, y: e.clientY + ofs.scrollTop};
      properties.mouseDown = true;
      break;
  }
}

const mouseMoveHandler = function (e: MouseEvent) {
  e.preventDefault()
    showPointerCoord(e.pageX, e.pageY)
  switch (state.mode) {
    case Mode.Move:
      if (!properties.mouseDown) break;
      const dx = pointerPanStart.x - e.clientX;
      const dy = pointerPanStart.y - e.clientY;
      window.scrollTo(dx, dy);
      break;
  }
}

const mouseUpHandler = function (e: MouseEvent) {
  e.preventDefault()
  switch (state.mode) {
    case Mode.Move:
      if (!properties.mouseDown) break;
      pointerPanStart = {x: 0, y: 0};
      properties.mouseDown = false;
      break;
  }
}

const showPointerCoord = function (posX: number, posY: number) {
  //TODO: how does this work?? 4096 is the orig size of the annotation canvas but the setup is scaled down to 3840.
  const scalar = 4096 / state.annotationRef!.height;
  const mapX = (posX * scalar) >> 0;
  const mapY = (posY * scalar) >> 0;
  const coord = canvasPos2LatLong({x: mapX, y: mapY});
  const strCrd = strLatLong(coord);
  state.message = `${strCrd.lat},${strCrd.long} | X:${mapX},Y:${mapY}`;
}

let last_zoom = 1

export function scaleView(mousePos: Point | undefined) { // Add event parameter to capture mouse position

  const dimension = state.map!.pixels * properties.zoom;
  const dim_str = dimension.toString() + "px";
  const scale = properties.zoom / last_zoom;

  const scroll_element = document.scrollingElement!;
  const client_width = scroll_element.clientWidth;
  const client_height = scroll_element.clientHeight;

  // Get mouse position relative to the viewport
  const mouseX = mousePos ? mousePos.x : client_width / 2; // Fallback to center if no event
  const mouseY = mousePos ? mousePos.y : client_height / 2;

  // Calculate mouse position relative to the document before scaling
  const doc_mouseX = scroll_element.scrollLeft + mouseX;
  const doc_mouseY = scroll_element.scrollTop + mouseY;

  state.airbasesRef!.style.width = dim_str;
  state.airbasesRef!.style.height = dim_str;

  state.mapRef!.style.width = dim_str;
  state.mapRef!.style.height = dim_str;

  state.annotationRef!.width = dimension;
  state.annotationRef!.height = dimension;

  // Scale bullseye coordinates
// bullseye.x *= scale;
// bullseye.y *= scale;

  // Calculate new scroll position to keep mouse point fixed
  const new_doc_mouseX = doc_mouseX * scale;
  const new_doc_mouseY = doc_mouseY * scale;
  scroll_element.scrollLeft = new_doc_mouseX - mouseX;
  scroll_element.scrollTop = new_doc_mouseY - mouseY;

  last_zoom = properties.zoom;
}

export function strLatLong(crd: Coord): CoordStr {
  const degLat = crd.lat;
  const lat = (degLat < 0 ? "S" : "N") + degreesString(degLat);
  const degLong = crd.long;
  const long = (degLong < 0 ? "W" : "E") + degreesString(degLong);
  return {lat, long}
}

export function canvasPos2LatLong(point: Point): Coord {
  const map = state.map!
  const dx = point.x * map.resolution;
  const dy = (map.pixels - point.y) * map.resolution;
  return map2LatLong({lat: map.datum.lat, long: map.datum.long}, {x: dx, y: dy});
}

function map2LatLong(datum: Coord, loc: Point): Coord {
  const KM_TO_FT = 3280.8399;
  const x = loc.x - 512 * KM_TO_FT;
  const y = loc.y - 512 * KM_TO_FT;
  const result = offsetToLatLon(datum.lat, datum.long, x, y);
  return {lat: result.lat, long: result.long};
}

function offsetToLatLon(lat0: number, lon0: number, xOffsetFt: number, yOffsetFt: number): Coord {
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
  const latEst = lat0 + deltaLat; // Estimated target latitude
  const scale = (1 / Math.cos(latEst * deg2rad)) * 1.002; // Longitude scale with correction for 0.710367° error

  const xMCorrected = xM * scale;

  // Convert origin (lat0, lon0) to Web Mercator coordinates
  const x0 = R * lon0 * deg2rad;
  const y0 = R * Math.log(Math.tan(Math.PI / 4 + lat0 * deg2rad / 2));

  // Apply corrected offsets
  const x = x0 + xMCorrected;
  const y = y0 + yM;

  // Convert back to latitude and longitude
  const long = x / (R * deg2rad);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) / deg2rad;

  return {lat, long};
}

function degreesString(degrees: number): string {
  const degInt = degrees >> 0;
  const min = ((degrees - degInt) * 60).toFixed(3);
  const deg = degInt.toFixed(0);
  return deg + "\xb0" + min + "'";
}
