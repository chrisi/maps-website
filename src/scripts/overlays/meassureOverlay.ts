import {BaseOverlay} from "@/scripts/overlays/baseOverlay.ts";
import type {Point} from "@/model/base.ts";
import type {DrawingContext, OverlayContext} from "@/scripts/overlay.ts";
import {Mode} from "@/model/mode.ts";
import {midpoint, rad2deg, vector} from "@/scripts/math.ts";

export class MeassureOverlay extends BaseOverlay {

  private from: Point | undefined
  private to: Point | undefined

  constructor(ctx: OverlayContext) {
    super(ctx);
  }

  public onRedraw = (dc: DrawingContext) => {
    if (!this.from) return;
    if (!this.to) return;
    this.from.x *= dc.deltaScale;
    this.from.y *= dc.deltaScale;
    this.to.x *= dc.deltaScale;
    this.to.y *= dc.deltaScale;
    this.drawRuler(dc, this.from, this.to);
  }

  public onMouseDown(e: MouseEvent) {
    switch (this.global.mode) {
      case Mode.Measure:
        this.from = {x: e.pageX, y: e.pageY};
        this.ovlCtx.redraw(1, true)
        break;
    }
  }

  public onMouseUp = () => {
    switch (this.global.mode) {
      case Mode.Measure:
        this.to = undefined;
        this.from = undefined;
        this.ovlCtx.redraw(1, true)
        break;
    }
  }

  public onMouseMove = (e: MouseEvent) => {
    switch (this.global.mode) {
      case Mode.Measure:
        if (this.ovlCtx.isMouseDown) {
          this.to = {x: e.pageX, y: e.pageY};
          this.ovlCtx.redraw(1, true)
        }
        break;
    }
  }

  private drawRuler(dc: DrawingContext, from: Point, to: Point) {
    const vec = vector({x: from.x, y: from.y}, {x: to.x, y: to.y});
    const mid = midpoint({x: from.x, y: from.y}, {x: to.x, y: to.y});
    const ctx = dc.cnvCtx
    ctx.strokeStyle = '#383b79';
    ctx.fillStyle = '#383b79';
    ctx.setLineDash([]);
    ctx.lineWidth = 2 * this.global.zoom.factor;
    ctx.beginPath();
    ctx.fillRect(from.x - 3, from.y - 3, 6, 6);
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    this.drawMeasurement(dc, mid, vec.mag, vec.dir);
    ctx.stroke();
  }

  private drawMeasurement(dc: DrawingContext, pt: Point, distance: number, radians: number) {
    const px2nm = 6.95; // pixel to Nm scaler
    const xPos = pt.x - 50;
    const yPos = pt.y - 12;
    const degrees = rad2deg(radians);
    const scaledDist = Math.round(distance / (px2nm * this.global.zoom.factor));
    const ctx = dc.cnvCtx
    ctx.lineWidth = 1;
    ctx.font = '16px courier-new';
    ctx.fillRect(xPos, yPos, 115, 24);
    ctx.fillStyle = 'white';
    ctx.fillText(degrees + "\xb0 / " + scaledDist + " NM", xPos + 8, yPos + 18, 100);
  }

}
