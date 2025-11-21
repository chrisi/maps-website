import {Mode} from "@/model/mode.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {useGlobalStore} from "@/stores/global.ts";
import type {Coord, CoordStr, Point} from "@/model/base.ts";
import {type OverlayContext} from "@/scripts/overlay.ts";
import {BaseOverlay} from "@/scripts/baseOverlay.ts";

export class ZoomPanOverlay extends BaseOverlay {

  private pointerPanStart = {x: 0, y: 0};
  private wheel_enabled = true;
  private last_zoom = 1

  private ctx: OverlayContext

  private global = useGlobalStore()

  private settings = useSettingsStore()

  constructor(ctx: OverlayContext) {
    console.log("initializing zoom-pan overlay")
    super();
    this.ctx = ctx;
  }

  public zoom = (dir: number) => {
    if (Math.sign(dir) > 0)
      this.global.zoom.factor /= this.global.zoom.speed;
    else
      this.global.zoom.factor *= this.global.zoom.speed;
    if (this.global.zoom.factor < this.global.zoom.min)
      this.global.zoom.factor = this.global.zoom.min;
    if (this.global.zoom.factor > this.global.zoom.max)
      this.global.zoom.factor = this.global.zoom.max;
  }

  public scaleView(mousePos: Point | undefined) { // Add event parameter to capture mouse position

    const dimension = this.global.map!.pixels * this.global.zoom.factor;
    const dim_str = dimension.toString() + "px";
    const scale = this.global.zoom.factor / this.last_zoom;

    const scroll_element = document.scrollingElement!;
    const client_width = scroll_element.clientWidth;
    const client_height = scroll_element.clientHeight;

    // Get mouse position relative to the viewport
    const mouseX = mousePos ? mousePos.x : client_width / 2; // Fallback to center if no event
    const mouseY = mousePos ? mousePos.y : client_height / 2;

    // Calculate mouse position relative to the document before scaling
    const doc_mouseX = scroll_element.scrollLeft + mouseX;
    const doc_mouseY = scroll_element.scrollTop + mouseY;

    this.ctx.airbases.style.width = dim_str;
    this.ctx.airbases.style.height = dim_str;

    this.ctx.map.style.width = dim_str;
    this.ctx.map.style.height = dim_str;

    this.ctx.canvas.width = dimension;
    this.ctx.canvas.height = dimension;

    // Calculate new scroll position to keep mouse point fixed
    const new_doc_mouseX = doc_mouseX * scale;
    const new_doc_mouseY = doc_mouseY * scale;
    scroll_element.scrollLeft = new_doc_mouseX - mouseX;
    scroll_element.scrollTop = new_doc_mouseY - mouseY;

    this.last_zoom = this.global.zoom.factor;

    this.ctx.redraw(scale);
  }

  public onMouseDown = (e: MouseEvent) => {
    switch (this.global.mode) {
      case Mode.Move:
        const ofs = document.scrollingElement!;
        this.pointerPanStart = {x: e.clientX + ofs.scrollLeft, y: e.clientY + ofs.scrollTop};
        break;
    }
  }

  public onMouseMove = (e: MouseEvent) => {
    if (this.settings.viz.xy)
      this.showPointerCoord(e.pageX, e.pageY)
    switch (this.global.mode) {
      case Mode.Move:
        if (!this.ctx.isMouseDown) break;
        const dx = this.pointerPanStart.x - e.clientX;
        const dy = this.pointerPanStart.y - e.clientY;
        window.scrollTo(dx, dy);
        break;
    }
  }

  public onMouseUp = () => {
    switch (this.global.mode) {
      case Mode.Move:
        this.pointerPanStart = {x: 0, y: 0};
        break;
    }
  }

  public onWheel = (e: WheelEvent) => {
    // Ensure zoom stays within limits and apply rounding to avoid floating-point drift
    if (this.wheel_enabled) {
      this.zoom(e.deltaY);
      this.scaleView({x: e.clientX, y: e.clientY});
      // saveSettings();
      // refreshCanvas();
      this.wheel_enabled = false;
      setTimeout(() => {
        this.wheel_enabled = true;
      }, (1 / this.global.zoom.wheelRate) * 1000);
    }
  }

  private showPointerCoord = (posX: number, posY: number) => {
    //TODO: how does this work?? 4096 is the orig size of the annotation canvas but the setup is scaled down to 3840.
    const scalar = 4096 / this.ctx.canvas.height;
    const mapX = (posX * scalar) >> 0;
    const mapY = (posY * scalar) >> 0;
    const coord = this.canvasPos2LatLong({x: mapX, y: mapY});
    const strCrd = this.strLatLong(coord);
    this.global.message = `${strCrd.lat},${strCrd.long} | X:${mapX},Y:${mapY}`;
  }

  private strLatLong = (crd: Coord): CoordStr => {
    const degLat = crd.lat;
    const lat = (degLat < 0 ? "S" : "N") + this.degreesString(degLat);
    const degLong = crd.long;
    const long = (degLong < 0 ? "W" : "E") + this.degreesString(degLong);
    return {lat, long}
  }

  private degreesString = (degrees: number): string => {
    const degInt = degrees >> 0;
    const min = ((degrees - degInt) * 60).toFixed(3);
    const deg = degInt.toFixed(0);
    return deg + "\xb0" + min + "'";
  }

  private canvasPos2LatLong = (point: Point): Coord => {
    const map = this.global.map!
    const dx = point.x * map.resolution;
    const dy = (map.pixels - point.y) * map.resolution;
    return this.map2LatLong({lat: map.datum.lat, long: map.datum.long}, {x: dx, y: dy});
  }

  private map2LatLong = (datum: Coord, loc: Point): Coord => {
    const KM_TO_FT = 3280.8399;
    const x = loc.x - 512 * KM_TO_FT;
    const y = loc.y - 512 * KM_TO_FT;
    const result = this.offsetToLatLon(datum.lat, datum.long, x, y);
    return {lat: result.lat, long: result.long};
  }

  private offsetToLatLon = (lat0: number, lon0: number, xOffsetFt: number, yOffsetFt: number): Coord => {
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
}
