import type {Point} from "@/model/base.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {alphaColor, dashStyle} from "@/scripts/draw.ts";
import {detectCorners, simplifyPoints} from "@/scripts/spline.ts";
import {generateGuid} from "@/scripts/utils.ts";
import {type WbFreehand, WbShapeType} from "@/model/overlays.ts";
import type {WhiteboardSettings} from "@/model/settings.ts";

export class SplinePainter {

  private line: Point[] = []
  private cornerIndices: number[] = []

  private isDrawing = false
  private supportPointSize = 3

  public isDrawingSpline(): boolean {
    return this.isDrawing
  }

  public startDrawing(pt: Point) {
    this.isDrawing = true
    this.line = [pt]
  }

  public stopDrawing(paintConfig: WhiteboardSettings, scale: number): WbFreehand | undefined {
    this.isDrawing = false
    this.line = simplifyPoints(this.line, scale)
    this.cornerIndices = detectCorners(this.line)
    const fh: WbFreehand = {
      type: WbShapeType.Freehand,
      guid: generateGuid(),
      points: this.line,
      cornerIndices: this.cornerIndices,
      color: alphaColor(paintConfig.line.color, paintConfig.line.opacity),
      lineWidth: paintConfig.line.width,
      dash: dashStyle(paintConfig.line.width, paintConfig.line.style)
    }
    this.line = []
    this.cornerIndices = []
    return fh.points.length > 1 ? fh : undefined
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
    ctx.strokeStyle = alphaColor(paintConfig.line.color, paintConfig.line.opacity)
    ctx.lineWidth = paintConfig.line.width / cnv.scale
    ctx.lineDashOffset = 0
    const dash = dashStyle(paintConfig.line.width, paintConfig.line.style)
    ctx.setLineDash(dash)
    ctx.beginPath()
    const p0 = this.line[0]!
    ctx.moveTo(p0.x, p0.y)
    for (let i = 1; i < this.line.length; i++) {
      const pi = this.line[i]!
      ctx.lineTo(pi.x, pi.y)
    }
    ctx.stroke()
    if (paintConfig.supportPoints)
      this.drawSupportPoints(cnv)
  }

  public drawSupportPoints(cnv: Canvas, pts: Point[] = this.line) {
    const ctx = cnv.context
    ctx.lineWidth = 0.5 / cnv.scale
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'cyan'
    ctx.beginPath()
    pts.forEach(p => {
      ctx.moveTo(p.x + this.supportPointSize / cnv.scale, p.y)
      ctx.arc(p.x, p.y, this.supportPointSize / cnv.scale, 0, Math.PI * 2)
    })
    ctx.fill()
    ctx.stroke()
  }

}
