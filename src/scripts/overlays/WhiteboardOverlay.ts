import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";
import {Mode} from "@/model/mode.ts";
import {drawSmoothLine} from "@/scripts/draw.ts";
import {detectCorners, simplifyPoints} from "@/scripts/spline.ts";


interface Segment {
  points: Point[]
  cornerIndices: number[]
}

export class WhiteboardOverlay extends BaseOverlay {

  private segments: Segment[] = []

  private line: Point[] = []
  private cornerIndices: number[] = []

  private isDrawing = false

  public isEnabled(): boolean {
    return this.settings.viz.wb
  }

  public getActiveMode(): Mode | undefined {
    return Mode.Whiteboard
  }

  public onDraw(cnv: Canvas): void {
    if (this.line.length === 0 && this.segments.length === 0) return;
    const ctx = cnv.context
    ctx.lineWidth = 2
    ctx.strokeStyle = 'navy'
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.beginPath()
    if (this.line.length > 1) {
      const ps = this.toCnv(this.line[0]!, cnv)
      ctx.moveTo(ps.x, ps.y)
      for (let i = 1; i < this.line.length; i++) {
        const p = this.toCnv(this.line[i]!, cnv)
        ctx.lineTo(p.x, p.y)
      }
    }

    this.segments.forEach(seg => {
      drawSmoothLine(ctx, seg.points, seg.cornerIndices, (p) => this.toCnv(p, cnv))
    })

    ctx.stroke()

    this.drawSupportPoints(cnv)
  }

  public onPointerDown(e: PointerEvent) {
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.line = [pt]
    this.isDrawing = true
  }

  public onPointerUp(e: PointerEvent) {
    this.isDrawing = false
    this.line = simplifyPoints(this.line, this.manager?.getCanvas().scale || 1)
    this.cornerIndices = detectCorners(this.line)
    this.segments.push({points: this.line, cornerIndices: this.cornerIndices})
    this.line = []
    this.cornerIndices = []
    this.redraw()
  }

  private drawSupportPoints(cnv: Canvas) {
    const ctx = cnv.context
    ctx.lineWidth = 0.5
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'cyan'

    ctx.beginPath()
    for (let i = 0; i < this.line.length; i++) {
      const p = this.toCnv(this.line[i]!, cnv)
      ctx.moveTo(p.x + 3, p.y)
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.stroke()
  }

  public onPointerMove(e: PointerEvent) {
    if (!this.isDrawing) return;
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.line.push(pt)
    this.redraw()
  }
}
