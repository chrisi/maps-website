import type {Point} from "@/model/base.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {colorWithAlpha, dashStyle} from "@/scripts/draw.ts";
import {detectCorners, simplifyPoints} from "@/scripts/spline.ts";
import {generateGuid} from "@/scripts/utils.ts";
import type {WbFreehand} from "@/model/overlays.ts";
import type {WhiteboardSettings} from "@/model/settings.ts";

export class SplinePainter {

  private line: Point[] = []
  private cornerIndices: number[] = []

  private isDrawing = false

  public isDrawingSpline(): boolean {
    return this.isDrawing
  }

  public startDrawing(pt: Point) {
    this.isDrawing = true
    this.line = [pt]
  }

  private toCnv(pt: Point, cnv: Canvas): Point {
    return {x: (pt.x - cnv.offset.x) * cnv.scale, y: (pt.y - cnv.offset.y) * cnv.scale}
  }

  public stopDrawing(paintConfig: WhiteboardSettings, scale: number): WbFreehand {
    this.line = simplifyPoints(this.line, scale)
    this.cornerIndices = detectCorners(this.line)
    const fh: WbFreehand = {
      type: 'freehand',
      guid: generateGuid(),
      points: this.line,
      cornerIndices: this.cornerIndices,
      color: colorWithAlpha(paintConfig.lineColor, paintConfig.opacity),
      width: paintConfig.lineWidth,
      dash: dashStyle(paintConfig.lineWidth, paintConfig.lineStyle)
    }
    this.line = []
    this.cornerIndices = []
    this.isDrawing = false
    return fh
  }

  public addPoint(point: Point) {
    if (!this.isDrawing) return
    this.line.push(point)
  }

  public draw(cnv: Canvas, paintConfig: WhiteboardSettings): void {
    if (!this.isDrawing || this.line.length == 0) return
    const ctx = cnv.context
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = colorWithAlpha(paintConfig.lineColor, paintConfig.opacity)
    ctx.lineWidth = paintConfig.lineWidth
    ctx.lineDashOffset = 0
    const dash = dashStyle(paintConfig.lineWidth, paintConfig.lineStyle)
    ctx.setLineDash(dash)
    ctx.beginPath()
    const ps = this.toCnv(this.line[0]!, cnv)
    ctx.moveTo(ps.x, ps.y)
    for (let i = 1; i < this.line.length; i++) {
      const p = this.toCnv(this.line[i]!, cnv)
      ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
    if (paintConfig.supportPoints)
      this.drawSupportPoints(cnv)
  }

  public drawSupportPoints(cnv: Canvas, pts: Point[] = this.line) {
    const ctx = cnv.context
    ctx.lineWidth = 0.5
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'cyan'
    ctx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      const p = this.toCnv(pts[i]!, cnv)
      ctx.moveTo(p.x + 3, p.y)
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.stroke()
  }

}
