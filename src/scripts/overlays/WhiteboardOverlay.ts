import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";
import {Mode} from "@/model/mode.ts";
import {drawSmoothLine} from "@/scripts/draw.ts";
import {detectCorners, simplifyPoints} from "@/scripts/spline.ts";

export class WhiteboardOverlay extends BaseOverlay {

  private points: Point[] = []
  private isDrawing = false

  private cornerIndices: number[] = []

  public isEnabled(): boolean {
    return this.settings.viz.wb
  }

  public getActiveMode(): Mode | undefined {
    return Mode.Whiteboard
  }

  public onDraw(cnv: Canvas): void {
    if (this.points.length === 0) return;
    const ctx = cnv.context
    ctx.lineWidth = 2
    ctx.strokeStyle = 'navy'
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.beginPath()
    if (this.points.length < 2 || this.isDrawing) {
      const ps = this.toCnv(this.points[0]!, cnv)
      ctx.moveTo(ps.x, ps.y)
      for (let i = 1; i < this.points.length; i++) {
        const p = this.toCnv(this.points[i]!, cnv)
        ctx.lineTo(p.x, p.y)
      }
    } else {
      drawSmoothLine(ctx, this.points, this.cornerIndices, (p) => this.toCnv(p, cnv))
    }
    ctx.stroke()

    this.drawSupportPoints(cnv)
  }

  public onPointerDown(e: PointerEvent) {
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.points = [pt]
    this.isDrawing = true
  }

  public onPointerUp(e: PointerEvent) {
    this.isDrawing = false
    this.points = simplifyPoints(this.points, this.manager?.getCanvas().scale || 1)
    this.cornerIndices = detectCorners(this.points)
    this.redraw()
  }

  private drawSupportPoints(cnv: Canvas) {
    const ctx = cnv.context
    ctx.lineWidth = 0.5
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'cyan'

    ctx.beginPath()
    for (let i = 0; i < this.points.length; i++) {
      const p = this.toCnv(this.points[i]!, cnv)
      ctx.moveTo(p.x + 3, p.y)
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.stroke()
  }

  public onPointerMove(e: PointerEvent) {
    if (!this.isDrawing) return;
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.points.push(pt)
    this.redraw()
  }
}
