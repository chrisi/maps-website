import {Mode} from "@/model/mode.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";
import type {WbDrawType, WbDraw, WbFreehand} from "@/model/overlays.ts";
import {colorWithAlpha, dashStyle, drawSmoothLine} from "@/scripts/draw.ts";
import {detectCorners, simplifyPoints} from "@/scripts/spline.ts";
import {generateGuid} from "@/scripts/utils.ts";
import {watch} from "vue";

export class WhiteboardOverlay extends BaseOverlay {

  private freehands: WbFreehand[] = []

  private line: Point[] = []
  private cornerIndices: number[] = []

  private isDrawing = false

  public init() {
    this.imcsClient?.onDrawEvent((parts: WbDraw[]) => {
      this.addFreehand(parts[0]! as WbFreehand)
    })
    watch(() => this.settings.viz.wb, () => {
      this.redraw()
    })
  }

  public isEnabled(): boolean {
    return this.settings.viz.wb
  }

  public getActiveMode(): Mode | undefined {
    return Mode.Whiteboard
  }

  public onDraw(cnv: Canvas): void {
    if (this.line.length === 0 && this.freehands.length === 0) return;
    const ctx = cnv.context

    if (this.isDrawing && this.line.length > 1) {
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = colorWithAlpha(this.settings.settings.whiteboard.lineColor, this.settings.settings.whiteboard.opacity)
      ctx.lineWidth = this.settings.settings.whiteboard.lineWidth
      ctx.lineDashOffset = 0
      const dash = dashStyle(this.settings.settings.whiteboard.lineWidth, this.settings.settings.whiteboard.lineStyle)
      ctx.setLineDash(dash)
      ctx.beginPath()
      const ps = this.toCnv(this.line[0]!, cnv)
      ctx.moveTo(ps.x, ps.y)
      for (let i = 1; i < this.line.length; i++) {
        const p = this.toCnv(this.line[i]!, cnv)
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    }

    this.freehands.forEach(fh => {
      drawSmoothLine(ctx, fh.points, fh.cornerIndices, fh.color, fh.width, fh.dash, (p) => this.toCnv(p, cnv))
    })

    this.drawSupportPoints(cnv)
  }

  public onPointerDown(e: PointerEvent) {
    if (e.button != 0) return // only allow left click currently, TODO: right click for delete
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.line = [pt]
    this.isDrawing = true
  }

  public onPointerUp(e: PointerEvent) {
    this.isDrawing = false
    this.line = simplifyPoints(this.line, this.manager?.getCanvas().scale || 1)
    this.cornerIndices = detectCorners(this.line)
    const fh: WbFreehand = {
      type: 'freehand',
      guid: generateGuid(),
      points: this.line,
      cornerIndices: this.cornerIndices,
      color: colorWithAlpha(this.settings.settings.whiteboard.lineColor, this.settings.settings.whiteboard.opacity),
      width: this.settings.settings.whiteboard.lineWidth,
      dash: dashStyle(this.settings.settings.whiteboard.lineWidth, this.settings.settings.whiteboard.lineStyle)
    }
    this.addFreehand(fh)
    this.imcsClient!.msgSendDraw([fh])
    this.line = []
    this.cornerIndices = []
  }

  public addFreehand(fh: WbFreehand) {
    const existing = this.freehands.find(fhs => fhs.guid === fh.guid)
    if (existing) {
      existing.points = fh.points
      existing.cornerIndices = fh.cornerIndices
      existing.color = fh.color
      existing.width = fh.width
      existing.dash = fh.dash
    } else {
      this.freehands.push(fh)
    }
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
