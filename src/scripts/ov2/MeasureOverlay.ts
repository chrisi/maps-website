import type {Point} from "@/model/base.ts";
import {Mode} from "@/model/mode.ts";
import {midpoint, rad2deg, vector} from "@/scripts/math.ts";
import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";

export class MeasureOverlay extends BaseOverlay {

  private from: Point | undefined
  private to: Point | undefined

  private active = false

  public onDraw = (cnv: Canvas) => {
    if (!this.from || !this.to) return
    this.drawRuler(cnv, this.from, this.to)
  }

  public onPointerDown(e: PointerEvent) {
    if (this.global.mode != Mode.Measure) return
    if (e.button != 0) return
    this.active = true
    this.from = this.fromCnv({x: e.pageX, y: e.pageY})
    this.redraw()
  }

  public onPointerUp(e: PointerEvent) {
    if (this.global.mode != Mode.Measure) return
    if (e.button != 0) return
    this.active = false
    this.to = undefined
    this.from = undefined
    this.redraw()
  }

  public onPointerMove(e: PointerEvent) {
    if (this.global.mode != Mode.Measure) return
    if (!this.active) return
    this.to = this.fromCnv({x: e.pageX, y: e.pageY})
    this.redraw()
  }

  private drawRuler(cnv: Canvas, from: Point, to: Point) {
    const pFrom = this.toCnv(from, cnv)
    const pTo = this.toCnv(to, cnv)
    const vec = vector(from, to);
    const mid = midpoint(from, to);
    const ctx = cnv.context
    ctx.strokeStyle = '#383b79';
    ctx.fillStyle = '#383b79';
    ctx.setLineDash([]);
    ctx.lineWidth = 2 * this.global.zoom.factor;
    ctx.beginPath();
    ctx.fillRect(pFrom.x - 3, pFrom.y - 3, 6, 6);
    ctx.moveTo(pFrom.x, pFrom.y);
    ctx.lineTo(pTo.x, pTo.y);
    ctx.stroke();
    ctx.beginPath();
    this.drawMeasurement(cnv, mid, vec.mag, vec.dir);
    ctx.stroke();
  }

  private drawMeasurement(cnv: Canvas, pt: Point, distance: number, radians: number) {
    const ctx = cnv.context
    const px2nm = 6.95; // pixel to Nm scaler
    const pos = this.toCnv(pt, cnv)
    const degrees = rad2deg(radians);
    const scaledDist = Math.round(distance / (px2nm * this.global.zoom.factor));
    ctx.lineWidth = 1;
    ctx.font = '16px courier-new';
    ctx.fillRect(pos.x - 50, pos.y - 12, 115, 24);
    ctx.fillStyle = 'white';
    ctx.fillText(degrees + "\xb0 / " + scaledDist + " NM", pos.x - 48, pos.y + 6, 100);
  }

}
