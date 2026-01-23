import {Mode} from "@/model/mode.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";
import type {LineSegment} from "@/model/overlays.ts";
import {colorWithAlpha, drawSmoothLine} from "@/scripts/draw.ts";
import {detectCorners, simplifyPoints} from "@/scripts/spline.ts";

export class WhiteboardOverlay extends BaseOverlay {

  private segments: LineSegment[] = []

  private line: Point[] = []
  private cornerIndices: number[] = []

  private isDrawing = false

  public init() {
    this.imcsClient?.onDrawEvent((segments: LineSegment[]) => {
      console.log("Received draw event", segments)
      this.addSegment(segments[0]!)
    })
  }

  public isEnabled(): boolean {
    return this.settings.viz.wb
  }

  public getActiveMode(): Mode | undefined {
    return Mode.Whiteboard
  }

  public onDraw(cnv: Canvas): void {
    if (this.line.length === 0 && this.segments.length === 0) return;
    const ctx = cnv.context

    if (this.line.length > 1) {
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = colorWithAlpha(this.settings.settings.whiteboard.lineColor, this.settings.settings.whiteboard.opacity)
      ctx.lineWidth = this.settings.settings.whiteboard.lineWidth
      ctx.beginPath()
      const ps = this.toCnv(this.line[0]!, cnv)
      ctx.moveTo(ps.x, ps.y)
      for (let i = 1; i < this.line.length; i++) {
        const p = this.toCnv(this.line[i]!, cnv)
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    }

    this.segments.forEach(seg => {
      drawSmoothLine(ctx, seg.points, seg.cornerIndices, seg.color, seg.width, (p) => this.toCnv(p, cnv))
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
    const seg: LineSegment = {
      points: this.line,
      cornerIndices: this.cornerIndices,
      color: colorWithAlpha(this.settings.settings.whiteboard.lineColor, this.settings.settings.whiteboard.opacity),
      width: this.settings.settings.whiteboard.lineWidth,
    }
    this.addSegment(seg)
    this.imcsClient!.msgSendDraw([seg])
    this.line = []
    this.cornerIndices = []
    this.redraw()
  }

  public addSegment(seg: LineSegment) {
    this.segments.push(seg)
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
