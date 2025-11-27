import {Mode} from "@/model/mode.ts";
import type {Coord, CoordStr, Point} from "@/model/base.ts";
import {type OverlayContext} from "@/scripts/overlay.ts";
import {BaseOverlay} from "@/scripts/overlays/baseOverlay.ts";
import {map2LatLong} from "@/scripts/math.ts";

export class ZoomPanOverlay extends BaseOverlay {

  private pointerPanStart = {x: 0, y: 0};
  private wheel_enabled = true;
  private last_zoom = 1

  constructor(ctx: OverlayContext) {
    super(ctx);
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

  public scaleView = (mousePos?: Point) => { // Add event parameter to capture mouse position

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

    this.ovlCtx.map.style.width = dim_str;
    this.ovlCtx.map.style.height = dim_str;

    this.ovlCtx.canvas.width = dimension;
    this.ovlCtx.canvas.height = dimension;

    // Calculate new scroll position to keep mouse point fixed
    const new_doc_mouseX = doc_mouseX * scale;
    const new_doc_mouseY = doc_mouseY * scale;
    scroll_element.scrollLeft = new_doc_mouseX - mouseX;
    scroll_element.scrollTop = new_doc_mouseY - mouseY;

    this.last_zoom = this.global.zoom.factor;

    this.ovlCtx.redraw(scale);
  }

  public onMouseDown = (e: MouseEvent) => {
    if (!((this.global.mode == Mode.Move && this.isLeftMouse(e)) || this.isAuxMouse(e))) return
    const ofs = document.scrollingElement!;
    this.pointerPanStart = {x: e.clientX + ofs.scrollLeft, y: e.clientY + ofs.scrollTop};
  }

  public onMouseMove = (e: MouseEvent) => {
    if (this.settings.viz.xy)
      this.showPointerCoord(e.pageX, e.pageY)
    if (!((this.global.mode == Mode.Move && this.isLeftMouseDown()) || this.isAuxMouseDown())) return
    const dx = this.pointerPanStart.x - e.clientX
    const dy = this.pointerPanStart.y - e.clientY
    window.scrollTo(dx, dy)
  }

  public onMouseUp = (e: MouseEvent) => {
    if (!((this.global.mode == Mode.Move && this.isLeftMouse(e)) || this.isAuxMouse(e))) return
    this.pointerPanStart = {x: 0, y: 0};
  }

  public onWheel = (e: WheelEvent) => {
    // Ensure zoom stays within limits and apply rounding to avoid floating-point drift
    if (!this.wheel_enabled) return
    this.zoom(e.deltaY);
    this.scaleView({x: e.clientX, y: e.clientY});
    // saveSettings();
    // refreshCanvas();
    this.wheel_enabled = false;
    setTimeout(() => {
      this.wheel_enabled = true;
    }, (1 / this.global.zoom.wheelRate) * 1000);
  }

  private showPointerCoord = (posX: number, posY: number) => {
    //TODO: how does this work?? 4096 is the orig size of the annotation canvas but the setup is scaled down to 3840.
    const scalar = 4096 / this.ovlCtx.canvas.height;
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
    return map2LatLong({lat: map.datum.lat, long: map.datum.long}, {x: dx, y: dy});
  }
}
