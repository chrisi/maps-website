import {watch} from "vue";
import {Mode} from "@/model/mode.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import {SplinePainter} from "@/scripts/SplinePainter.ts";
import type {Point} from "@/model/base.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {WbCircle, WbShape, WbFreehand, WbLine} from "@/model/overlays.ts";
import {buildFreehandPath, colorWithAlpha, dashStyle} from "@/scripts/draw.ts";
import {generateGuid, getModMask, Mod} from "@/scripts/utils.ts";
import {distance, isPointOnCircle, isPointOnLine} from "@/scripts/math.ts";

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
      case DrawMode.Line:
        if (this.startPoint && this.cursorPoint) {
          // TODO: tmp
          const p1 = this.toCnv(this.startPoint)
          const p2 = this.toCnv(this.cursorPoint)
          const ctx = cnv.context
          ctx.lineWidth = 1.5
          ctx.strokeStyle = 'black'
          ctx.setLineDash([1, 3])
          this.drawLine(cnv, p1, p2)
        }
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
      case DrawMode.Freehand:
        this.drawWorldInScreenSpace(() => {
          this.splinePainter.draw(cnv, this.settings.settings.whiteboard)
        })
        break
    }
    this.drawWorldInScreenSpace(() => {
      this.shapes.forEach(s => {
        switch (s.type) {
          case 'line':
            this.drawWbLine(cnv, s as WbLine)
            break
          case 'circle':
            this.drawWbCircle(cnv, s as WbCircle)
            break
          case 'freehand':
            this.drawWbFreehand(cnv, s as WbFreehand)
            break
        }
      })
    })
  }

  public onPointerDown(e: PointerEvent) {
    if (e.button == 0) {
      this.drawMode = this.determineDrawMode(e)
      const pt = this.fromCnv({x: e.pageX, y: e.pageY})
      switch (this.drawMode) {
        case DrawMode.Line:
        case DrawMode.Circle:
          this.startPoint = pt
          break
        case DrawMode.Freehand:
          this.splinePainter.startDrawing(pt)
          break
        default:
      }
    }
  }

  public onPointerUp(e: PointerEvent) {
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    if (e.button == 0) {
      const cfg = this.settings.settings.whiteboard
      const colFill = colorWithAlpha(cfg.fillColor, cfg.opacity * 0.4)
      const colLine = colorWithAlpha(cfg.lineColor, cfg.opacity)
      const dash = dashStyle(cfg.lineWidth, cfg.lineStyle)
      switch (this.drawMode) {
        case DrawMode.Line:
          const l: WbLine = {
            type: 'line',
            guid: generateGuid(),
            p1: this.startPoint!,
            p2: pt,
            color: colLine,
            width: cfg.lineWidth,
            dash: dash
          }
          this.addShape(l)
          this.imcsClient!.msgSendDraw([l])
          break
        case DrawMode.Circle:
          const c: WbCircle = {
            type: 'circle',
            guid: generateGuid(),
            center: this.startPoint!,
            radius: distance(this.startPoint!, pt),
            color: colLine,
            width: cfg.lineWidth,
            fillColor: colFill,
            dash: dash
          }
          this.addShape(c)
          this.imcsClient!.msgSendDraw([c])
          break
        case DrawMode.Freehand:
          const fh = this.splinePainter.stopDrawing(this.settings.settings.whiteboard, this.getCanvas().scale || 1);
          if (fh) {
            this.addShape(fh)
            this.imcsClient!.msgSendDraw([fh])
          }
          break
        default:
      }
      this.drawMode = DrawMode.None
    }

    if (e.button == 2) {
      this.shapes = this.shapes.filter(s => {
        switch (s.type) {
          case 'line':
            const l = s as WbLine
            return !isPointOnLine(l.p1, l.p2, pt, 5 / this.getCanvas().scale)
          case 'circle':
            const c = s as WbCircle
            return !isPointOnCircle(c.center, c.radius, pt, 5 / this.getCanvas().scale)
          case 'freehand':
            return !this.hitTestFreehand(this.getCanvas()!, s as WbFreehand, pt, 5)
          default:
        }
        return true
      })
    }

    this.redraw()
  }

  public onPointerMove(e: PointerEvent) {
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    switch (this.drawMode) {
      case DrawMode.Line:
      case DrawMode.Circle:
        this.cursorPoint = pt
        break
      case DrawMode.Freehand:
        if (!this.splinePainter.isDrawingSpline()) return
        this.splinePainter.addPoint(pt)
        break
      default:
    }
    this.redraw()
  }

  public addShape(fh: WbShape) {
    this.shapes.push(fh)
    this.redraw()
  }

  private drawWbFreehand(cnv: Canvas, fh: WbFreehand) {
    if (!fh.path) fh.path = buildFreehandPath(fh.points, fh.cornerIndices)
    const ctx = cnv.context
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = fh.color
    ctx.lineWidth = fh.width / cnv.scale
    ctx.setLineDash(fh.dash)
    ctx.stroke(fh.path!)
    if (this.settings.settings.whiteboard.supportPoints)
      this.splinePainter.drawSupportPoints(cnv, fh.points)
  }

  private drawWbCircle(cnv: Canvas, c: WbCircle) {
    const ctx = cnv.context
    ctx.strokeStyle = c.color
    ctx.fillStyle = c.fillColor
    ctx.lineWidth = c.width / cnv.scale
    ctx.setLineDash(c.dash)
    this.drawCircle(cnv, c.center, c.radius)
    ctx.fill()
  }

  private drawCircle(cnv: Canvas, ctr: Point, rad: number) {
    const ctx = cnv.context
    ctx.beginPath()
    ctx.arc(ctr.x, ctr.y, rad, 0, 2 * Math.PI)
    ctx.stroke()
  }

  private drawWbLine(cnv: Canvas, l: WbLine) {
    const ctx = cnv.context
    ctx.strokeStyle = l.color
    ctx.lineWidth = l.width / cnv.scale
    ctx.setLineDash(l.dash)
    this.drawLine(cnv, l.p1, l.p2)
    ctx.fill()
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

  private hitTestFreehand(cnv: Canvas, fh: WbFreehand, pt: Point, tol: number): boolean {
    const ctx = cnv.context
    ctx.save()
    // ensure identity transform to make isPointInStroke work correctly for world space coordinates (removed dpr transform)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.lineWidth = (fh.width + tol) / cnv.scale
    ctx.setLineDash([])
    const hit = ctx.isPointInStroke(fh.path!, pt.x, pt.y)
    ctx.restore()
    return hit
  }
}
