import {Mode} from "@/model/mode.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {WbCircle, WbShape, WbFreehand} from "@/model/overlays.ts";
import {colorWithAlpha, dashStyle, drawSmoothLine} from "@/scripts/draw.ts";
import {watch} from "vue";
import {SplinePainter} from "@/scripts/SplinePainter.ts";
import {generateGuid, getModMask, Mod} from "@/scripts/utils.ts";
import type {Point} from "@/model/base.ts";
import {distance} from "@/scripts/math.ts";

enum DrawMode {
  None = 0,
  Freehand = 1,
  Line = 2,
  Circle = 3,
  Rect = 4
}

export class WhiteboardOverlay extends BaseOverlay {

  private shapes: WbShape[] = []

  private drawMode: DrawMode = DrawMode.None
  private splinePainter: SplinePainter = new SplinePainter()
  private startPoint: Point | undefined = undefined
  private cursorPoint: Point | undefined = undefined

  public init() {
    this.imcsClient?.onDrawEvent((shapes: WbShape[]) => {
      shapes.forEach(p => {
        this.addShape(p)
      })
    })
    watch(() => this.settings.viz.wb, () => {
      this.redraw()
    })
    watch(() => this.settings.settings.whiteboard.supportPoints, () => {
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
    switch (this.drawMode) {
      case DrawMode.Freehand:
        this.splinePainter.draw(cnv, this.settings.settings.whiteboard)
        break
      case DrawMode.Circle:
        if (this.startPoint && this.cursorPoint) {
          // TODO: tmp
          const ctr = this.toCnv(this.startPoint)
          const cur = this.toCnv(this.cursorPoint)
          const dist = distance(ctr, cur)
          const ctx = cnv.context
          ctx.lineWidth = 1.5
          ctx.strokeStyle = 'black'
          ctx.setLineDash([1, 3])
          this.drawCircle(cnv, ctr, dist)
          this.drawLine(cnv, ctr, cur)
        }
        break
    }

    this.shapes.forEach(s => {
      switch (s.type) {
        case 'freehand':
          const fh = s as WbFreehand
          drawSmoothLine(cnv.context, fh.points, fh.cornerIndices, fh.color, fh.width, fh.dash, (p) => this.toCnv(p, cnv))
          if (this.settings.settings.whiteboard.supportPoints)
            this.splinePainter.drawSupportPoints(cnv, fh.points)
          break
        case 'circle':
          this.drawWbCircle(cnv, s as WbCircle)
          break
      }
    })
  }

  public onPointerDown(e: PointerEvent) {
    if (e.button != 0) return // only allow left click currently, TODO: right click for delete
    this.drawMode = this.determineDrawMode(e)
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    switch (this.drawMode) {
      case DrawMode.Freehand:
        this.splinePainter.startDrawing(pt)
        break
      case DrawMode.Circle:
        this.startPoint = pt
        break
      default:
    }
  }

  public onPointerUp(e: PointerEvent) {
    if (e.button != 0) return // only allow left click currently, TODO: right click for delete

    const cfg = this.settings.settings.whiteboard
    const colFill = colorWithAlpha(cfg.fillColor, cfg.opacity * 0.4)
    const colLine = colorWithAlpha(cfg.lineColor, cfg.opacity)
    const dash = dashStyle(cfg.lineWidth, cfg.lineStyle)

    switch (this.drawMode) {
      case DrawMode.Circle:
        const c: WbCircle = {
          type: 'circle',
          guid: generateGuid(),
          center: this.startPoint!,
          radius: distance(this.startPoint!, this.fromCnv({x: e.pageX, y: e.pageY})),
          color: colLine,
          width: cfg.lineWidth,
          fillColor: colFill,
          dash: dash
        }
        this.addShape(c)
        this.imcsClient!.msgSendDraw([c])
        break
      case DrawMode.Freehand:
        const fh = this.splinePainter.stopDrawing(this.settings.settings.whiteboard, this.manager?.getCanvas().scale || 1);
        this.addShape(fh)
        this.imcsClient!.msgSendDraw([fh])
        break
      default:
    }

    this.drawMode = DrawMode.None
  }

  public onPointerMove(e: PointerEvent) {
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    switch (this.drawMode) {
      case DrawMode.Freehand:
        if (!this.splinePainter.isDrawingSpline()) return
        this.splinePainter.addPoint(pt)
        break
      case DrawMode.Circle:
        this.cursorPoint = pt
        break
      default:
    }
    this.redraw()
  }

  public addShape(fh: WbShape) {
    this.shapes.push(fh)
    this.redraw()
  }

  private drawWbCircle(cnv: Canvas, c: WbCircle) {
    const ctx = cnv.context
    const p = this.toCnv(c.center, cnv)
    ctx.strokeStyle = c.color
    ctx.fillStyle = c.fillColor
    ctx.lineWidth = c.width
    ctx.setLineDash(c.dash)
    this.drawCircle(cnv, p, c.radius * cnv.scale)
    ctx.fill()
  }

  private drawCircle(cnv: Canvas, ctr: Point, rad: number) {
    const ctx = cnv.context
    ctx.beginPath()
    ctx.arc(ctr.x, ctr.y, rad, 0, 2 * Math.PI)
    ctx.stroke()
  }

  private drawLine(cnv: Canvas, p1: Point, p2: Point) {
    const ctx = cnv.context
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  //we cannot use ctrl as a modifier for left-click since firefox handles this as right-click on Mac
  private determineDrawMode(e: PointerEvent): DrawMode {
    if (getModMask(e) == Mod.Shift) return DrawMode.Line
    if (getModMask(e) == Mod.Shift + Mod.Alt) return DrawMode.Rect
    if (getModMask(e) == Mod.Alt) return DrawMode.Circle
    return DrawMode.Freehand
  }
}
