import {midpoint, rad2deg, vector} from "@/scripts/math.ts";
import {drawArrowHead, drawOutlined, drawTextWithBox} from "@/scripts/draw.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";

export class MeasureOverlay extends BaseOverlay {

  private from: Point | undefined
  private to: Point | undefined

  private active = false

  private rulerColor = '#383b79'
  private textColor = 'white'
  private tickDist = 25
  private font = '14px monospace'

  public onDraw = (cnv: Canvas) => {
    if (!this.from || !this.to) return
    this.drawRuler(cnv, this.from, this.to)
  }

  public onPointerDown(e: PointerEvent) {
    if (e.button != 0) return
    this.active = true
    this.from = this.fromCnv({x: e.pageX, y: e.pageY})
    this.redraw()
  }

  public onPointerUp(e: PointerEvent) {
    if (e.button != 0) return
    this.active = false
    this.to = undefined
    this.from = undefined
    this.redraw()
  }

  public onPointerMove(e: PointerEvent) {
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
    ctx.strokeStyle = this.rulerColor;
    ctx.fillStyle = this.rulerColor;
    ctx.lineWidth = 2;
    ctx.fillRect(pFrom.x - 3, pFrom.y - 3, 6, 6);
    drawOutlined(ctx, "white", this.rulerColor, 2, 1, c => {
      ctx.moveTo(pFrom.x, pFrom.y);
      ctx.lineTo(pTo.x, pTo.y);
    })
    ctx.strokeStyle = this.rulerColor;
    ctx.fillStyle = this.rulerColor;
    drawArrowHead(ctx, pTo.x, pTo.y, -vec.dir + Math.PI / 2, 10);
    this.drawTicks(cnv, pFrom, pTo);
    ctx.beginPath();
    this.drawMeasurement(cnv, mid, vec.mag, vec.dir);
    ctx.stroke();
  }

  private drawTicks(cnv: Canvas, pFrom: Point, pTo: Point) {
    const ctx = cnv.context;
    const vec = vector(pFrom, pTo);
    if (vec.mag === 0) return;
    const ux = (pTo.x - pFrom.x) / vec.mag;
    const uy = (pTo.y - pFrom.y) / vec.mag;
    const intPx = this.tickDist * this.global.map!.px2nm * cnv.scale;
    const tCnt = Math.floor(vec.mag / intPx);
    const tSize = 4;
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= tCnt; i++) {
      const tx = pFrom.x + ux * i * intPx;
      const ty = pFrom.y + uy * i * intPx;
      ctx.moveTo(tx + uy * tSize, ty - ux * tSize);
      ctx.lineTo(tx - uy * tSize, ty + ux * tSize);
    }
    ctx.stroke();
  }

  private drawMeasurement(cnv: Canvas, pt: Point, distance: number, radians: number) {
    const ctx = cnv.context
    const pos = this.toCnv(pt, cnv)
    const degrees = rad2deg(radians);
    const scaledDist = Math.round(distance / this.global.map!.px2nm);
    const text = degrees + "\xb0 / " + scaledDist + " NM";
    let rotation = radians + Math.PI / 2;
    if (rotation > Math.PI / 2 || rotation < -Math.PI / 2) rotation += Math.PI; // keep text upright
    const dy = -15; // Offset to draw above the line
    drawTextWithBox(ctx, text, pos.x, pos.y, this.font, this.rulerColor, this.textColor, -rotation, dy);
  }

}
