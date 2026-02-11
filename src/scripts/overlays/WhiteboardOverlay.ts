import {watch} from "vue";
import {OverlayMode} from "@/model/mode.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import {SplinePainter} from "@/scripts/SplinePainter.ts";
import type {Point} from "@/model/base.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {
  type WbCircle,
  type WbEllipse,
  type WbFreehand,
  type WbLine,
  type WbRect,
  type WbShape,
  WbShapeType,
  type WbText
} from "@/model/overlays.ts";
import {
  buildBezierPathFromPoints,
  alphaColor,
  dashStyle,
  drawCircle,
  drawEllipse,
  drawLine,
  drawRect,
  drawText,
  drawLineAlt
} from "@/scripts/draw.ts";
import {generateGuid, getModMask, Mod} from "@/scripts/utils.ts";
import {
  deg2rad,
  distance,
  isPointInRect,
  isPointOnCircle,
  isPointOnEllipse,
  isPointOnLine,
  isPointOnRect,
  rad2deg,
  vector
} from "@/scripts/math.ts";

enum DrawMode {
  Freehand = 0,
  Line = 1,
  Rect = 2,
  Circle = 3,
  Ellipse = 4,
  Text = 5
}

export class WhiteboardOverlay extends BaseOverlay {

  private shapes: WbShape[] = []

  private lockAspectRatio = false
  private drawMode: DrawMode | undefined = undefined
  private drawStep = 0
  private oldDrawStep = -1
  private rotation = 0
  private startRotation = 0
  private splinePainter: SplinePainter = new SplinePainter()
  private startPoint: Point | undefined = undefined
  private cursorPoint: Point | undefined = undefined

  public init() {
    this.imcsClient?.onDrawEvent((shapes: WbShape[]) => {
      shapes.forEach(p => {
        this.receiveShape(p)
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

  public isActive(mode: OverlayMode): boolean {
    return mode == OverlayMode.Whiteboard
  }

  public onDraw(cnv: Canvas): void {
    if (!this.startPoint || !this.cursorPoint) return
    const p1 = this.toCnv(this.startPoint)
    const p2 = this.toCnv(this.cursorPoint)
    const dist = distance(p1, p2)
    const ctx = cnv.context
    ctx.lineWidth = 2
    ctx.strokeStyle = 'black'
    ctx.setLineDash([2, 2])
    switch (this.drawMode) {
      case DrawMode.Line:
        drawLineAlt(ctx, p1, p2)
        break
      case DrawMode.Circle:
        drawCircle(ctx, p1, dist)
        drawLine(ctx, p1, p2)
        break
      case DrawMode.Ellipse:
        const re = this.getRotatedRectDimensions(p1, p2)
        if (this.lockAspectRatio) re.h = re.w
        drawEllipse(ctx, p1, re.w / 2, re.h / 2, this.rotation)
        drawLine(ctx, p1, p2)
        break
      case DrawMode.Rect:
        const rr = this.getRotatedRectDimensions(p1, p2)
        if (this.lockAspectRatio) rr.h = rr.w
        drawRect(ctx, p1, rr.w, rr.h, this.rotation)
        drawLine(ctx, p1, p2)
        break
      case DrawMode.Text:
        let fontSize = this.settings.settings.whiteboard.fontSize
        drawLine(ctx, p1, p2)
        let rot = 0
        if (dist > 25) {
          rot = vector(p1, p2).dir * -1 + Math.PI / 2
          if (this.drawStep == 1)
            rot = Math.round(rot / deg2rad(15)) * deg2rad(15)
          fontSize = this.getTextScale(this.settings.settings.whiteboard.text, dist)
        }
        ctx.setLineDash([])
        ctx.font = `${fontSize}px sans-serif`
        drawText(ctx, this.settings.settings.whiteboard.text, p1, rot, 'black')
        break
      case DrawMode.Freehand:
        this.drawWorldInScreenSpace(() => {
          this.splinePainter.draw(cnv, this.settings.settings.whiteboard)
        })
        break
    }
    ctx.setLineDash([])

    this.drawWorldInScreenSpace(() => {
      this.shapes.forEach(s => {
        switch (s.type) {
          case WbShapeType.Line:
            this.drawWbLine(cnv, s as WbLine)
            break
          case WbShapeType.Circle:
            this.drawWbCircle(cnv, s as WbCircle)
            break
          case WbShapeType.Ellipse:
            this.drawWbEllipse(cnv, s as WbEllipse)
            break
          case WbShapeType.Rect:
            this.drawWbRect(cnv, s as WbRect)
            break
          case WbShapeType.Freehand:
            this.drawWbFreehand(cnv, s as WbFreehand)
            break
          case WbShapeType.Text:
            this.drawWbText(cnv, s as WbText)
            break
        }
      })
    })
  }

  public onPointerDown(e: PointerEvent) {
    if (e.button == 0) {
      this.drawMode = this.determineDrawMode(e)
      this.startPoint = this.fromCnv({x: e.pageX, y: e.pageY})
      switch (this.drawMode) {
        case DrawMode.Line:
        case DrawMode.Circle:
          break
        case DrawMode.Ellipse:
        case DrawMode.Rect:
        case DrawMode.Text:
          this.rotation = 0
          break
        case DrawMode.Freehand:
          this.splinePainter.startDrawing(this.startPoint)
          break
        default:
      }
    }
  }

  public onPointerUp(e: PointerEvent) {
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    if ((e.button == 0) && this.startPoint) {
      const cfg = this.settings.settings.whiteboard
      const colFill = cfg.fillStyle == 'solid' ? alphaColor(cfg.fillColor, cfg.opacity * 0.4) : ''
      const colLine = alphaColor(cfg.lineColor, cfg.opacity)
      const dash = dashStyle(cfg.lineWidth, cfg.lineStyle)
      switch (this.drawMode) {
        case DrawMode.Line:
          const l: WbLine = {
            type: WbShapeType.Line,
            guid: generateGuid(),
            p1: this.startPoint,
            p2: pt,
            color: colLine,
            lineWidth: cfg.lineWidth,
            dash: dash
          }
          this.receiveShape(l)
          this.imcsClient!.msgSendDraw([l])
          break
        case DrawMode.Circle:
          const c: WbCircle = {
            type: WbShapeType.Circle,
            guid: generateGuid(),
            center: this.startPoint,
            radius: distance(this.startPoint, pt),
            color: colLine,
            lineWidth: cfg.lineWidth,
            fillColor: colFill,
            dash: dash
          }
          this.receiveShape(c)
          this.imcsClient!.msgSendDraw([c])
          break
        case DrawMode.Ellipse:
          const rr = this.getRotatedRectDimensions(this.startPoint, pt)
          if (this.lockAspectRatio) rr.h = rr.w
          const e: WbEllipse = {
            type: WbShapeType.Ellipse,
            guid: generateGuid(),
            center: this.startPoint,
            majorRad: rr.w / 2,
            minorRad: rr.h / 2,
            rotation: this.rotation,
            color: colLine,
            lineWidth: cfg.lineWidth,
            fillColor: colFill,
            dash: dash
          }
          this.receiveShape(e)
          this.imcsClient!.msgSendDraw([e])
          break
        case DrawMode.Rect: {
          const rr = this.getRotatedRectDimensions(this.startPoint, pt)
          if (this.lockAspectRatio) rr.h = rr.w
          const r: WbRect = {
            type: WbShapeType.Rect,
            guid: generateGuid(),
            center: this.startPoint,
            width: rr.w,
            height: rr.h,
            rotation: this.rotation,
            color: colLine,
            lineWidth: cfg.lineWidth,
            fillColor: colFill,
            dash: dash
          }
          this.receiveShape(r)
          this.imcsClient!.msgSendDraw([r])
          break
        }
        case DrawMode.Text: {
          const dist = distance(this.toCnv(this.startPoint), this.toCnv(pt))
          let fontSize = cfg.fontSize
          if (dist > 25) {
            fontSize = this.getTextScale(cfg.text, dist)
          }

          const t: WbText = {
            type: WbShapeType.Text,
            guid: generateGuid(),
            pos: this.startPoint,
            rotation: this.rotation,
            text: cfg.text,
            fontSize: fontSize / this.getCanvas().scale,
            color: colLine,
            lineWidth: cfg.lineWidth,
            dash: dash
          }
          this.receiveShape(t)
          this.imcsClient!.msgSendDraw([t])
          break
        }
        case DrawMode.Freehand:
          const fh = this.splinePainter.stopDrawing(this.settings.settings.whiteboard, this.getCanvas().scale || 1);
          if (fh) {
            this.receiveShape(fh)
            this.imcsClient!.msgSendDraw([fh])
          }
          break
        default:
      }
      this.drawMode = undefined
    }

    if (e.button == 2 || this.global.inputMode == "delete") {
      const del = this.shapes.findLast(s => {
        switch (s.type) {
          case WbShapeType.Line:
            const l = s as WbLine
            return isPointOnLine(l.p1, l.p2, pt, 5 / this.getCanvas().scale)
          case WbShapeType.Circle:
            const c = s as WbCircle
            return isPointOnCircle(c.center, c.radius, pt, 5 / this.getCanvas().scale)
          case WbShapeType.Ellipse:
            const e = s as WbEllipse
            return isPointOnEllipse(e.center, e.majorRad, e.minorRad, e.rotation, pt, 5 / this.getCanvas().scale)
          case WbShapeType.Rect:
            const r = s as WbRect
            return isPointOnRect(r.center, r.width, r.height, r.rotation, pt, 5 / this.getCanvas().scale)
          case WbShapeType.Freehand:
            return this.hitTestFreehand(this.getCanvas()!, s as WbFreehand, pt, 5)
          case WbShapeType.Text:
            return this.hitTestText(this.getCanvas()!, s as WbText, pt)
          default:
        }
        return false
      })
      if (del) {
        del.deleted = true
        this.imcsClient!.msgSendDraw([del])
        this.receiveShape(del)
      }
    }

    this.redraw()
  }

  public onPointerMove(e: PointerEvent) {
    this.drawStep = this.determineDrawStep(e)
    this.cursorPoint = this.fromCnv({x: e.pageX, y: e.pageY})
    switch (this.drawMode) {
      case DrawMode.Line:
      case DrawMode.Circle:
        break;
      case DrawMode.Ellipse:
      case DrawMode.Rect:
        this.lockAspectRatio = (getModMask(e) & Mod.Alt) > 0
        switch (this.drawStep) {
          case 1:
            if (this.drawStep != this.oldDrawStep)
              this.startRotation = rad2deg(vector(this.startPoint!, this.cursorPoint).dir) - this.rotation
            this.rotation = rad2deg(vector(this.startPoint!, this.cursorPoint).dir) - this.startRotation
            break
        }
        break
      case DrawMode.Text:
        this.rotation = distance(this.startPoint!, this.cursorPoint) > 25
          ? rad2deg(vector(this.startPoint!, this.cursorPoint).dir) - 90 : 0
        switch (this.drawStep) {
          case 1:
            this.rotation = Math.round(this.rotation / 15) * 15
            break
        }
        break
      case DrawMode.Freehand:
        if (!this.splinePainter.isDrawingSpline()) return
        this.splinePainter.addPoint(this.cursorPoint)
        break
      default:
    }
    this.oldDrawStep = this.drawStep
    this.redraw()
  }

  public receiveShape(rs: WbShape) {
    // normalize empty path cache
    if (rs.type == WbShapeType.Freehand) {
      const fh = rs as WbFreehand
      fh.path = undefined
    }
    if (rs.deleted) {
      // atm re-transmission only happens on delete
      const idx = this.shapes.findIndex(fs => fs.guid === rs.guid)
      if (idx >= 0) this.shapes.splice(idx, 1)
    } else
      this.shapes.push(rs)
    this.redraw()
  }

  private drawWbFreehand(cnv: Canvas, fh: WbFreehand) {
    if (!fh.path) fh.path = buildBezierPathFromPoints(fh.points, fh.cornerIndices)
    const ctx = cnv.context
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = fh.color
    ctx.lineWidth = fh.lineWidth / cnv.scale
    ctx.setLineDash(fh.dash)
    ctx.stroke(fh.path!)
    if (this.settings.settings.whiteboard.supportPoints)
      this.splinePainter.drawSupportPoints(cnv, fh.points)
  }

  private drawWbCircle(cnv: Canvas, c: WbCircle) {
    const ctx = cnv.context
    ctx.strokeStyle = c.color
    ctx.lineWidth = c.lineWidth / cnv.scale
    ctx.setLineDash(c.dash)
    drawCircle(cnv.context, c.center, c.radius)
    if (c.fillColor != '') {
      ctx.fillStyle = c.fillColor
      ctx.fill()
    }
  }

  private drawWbEllipse(cnv: Canvas, c: WbEllipse) {
    const ctx = cnv.context
    ctx.strokeStyle = c.color
    ctx.lineWidth = c.lineWidth / cnv.scale
    ctx.setLineDash(c.dash)
    drawEllipse(cnv.context, c.center, c.majorRad, c.minorRad, c.rotation)
    if (c.fillColor != '') {
      ctx.fillStyle = c.fillColor
      ctx.fill()
    }
  }

  private drawWbRect(cnv: Canvas, r: WbRect) {
    const ctx = cnv.context
    ctx.strokeStyle = r.color
    ctx.lineWidth = r.lineWidth / cnv.scale
    ctx.setLineDash(r.dash)
    drawRect(cnv.context, r.center, r.width, r.height, r.rotation)
    if (r.fillColor != '') {
      ctx.fillStyle = r.fillColor
      ctx.fill()
    }
  }

  private drawWbLine(cnv: Canvas, l: WbLine) {
    const ctx = cnv.context
    ctx.strokeStyle = l.color
    ctx.lineWidth = l.lineWidth / cnv.scale
    ctx.setLineDash(l.dash)
    drawLine(cnv.context, l.p1, l.p2)
  }

  private drawWbText(cnv: Canvas, t: WbText) {
    const ctx = cnv.context
    ctx.strokeStyle = t.color
    ctx.font = `${t.fontSize}px sans-serif`
    drawText(cnv.context, t.text, t.pos, deg2rad(t.rotation), t.color)
  }

  private determineDrawStep(e: PointerEvent): number {
    if (!this.drawMode) return 0
    if ((getModMask(e) & Mod.Shift) > 0) return 1
    return 0
  }

  //we cannot use ctrl as a modifier for left-click since firefox handles this as right-click on Mac
  private determineDrawMode(e: PointerEvent): DrawMode | undefined {
    if (this.drawMode)
      return this.drawMode
    let mode = undefined
    switch (this.global.inputMode) {
      case "line":
        mode = DrawMode.Line
        break
      case "ellipse":
        mode = DrawMode.Ellipse
        break
      case "rect":
        mode = DrawMode.Rect
        break
      case "freehand":
        mode = DrawMode.Freehand
        break
      case "text":
        mode = DrawMode.Text
        break
    }
    // quickly override mode with modifiers
    if (getModMask(e) == Mod.Shift) return DrawMode.Text
    if (getModMask(e) == Mod.Shift + Mod.Alt) return DrawMode.Rect
    if (getModMask(e) == Mod.Alt) return DrawMode.Ellipse
    return mode
  }

  private hitTestFreehand(cnv: Canvas, fh: WbFreehand, pt: Point, tol: number): boolean {
    const ctx = cnv.context
    ctx.save()
    // ensure identity transform to make isPointInStroke work correctly for world space coordinates (removed dpr transform)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.lineWidth = (fh.lineWidth + tol) / cnv.scale
    ctx.setLineDash([])
    const hit = ctx.isPointInStroke(fh.path!, pt.x, pt.y)
    ctx.restore()
    return hit
  }

  private hitTestText(cnv: Canvas, text: WbText, pt: Point): boolean {
    const ctx = cnv.context
    ctx.save()
    ctx.font = `${text.fontSize}px sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    const metrics = ctx.measureText(text.text)
    ctx.restore()

    const width = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

    const localCenterX = (metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) / 2
    const localCenterY = (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2

    const rot = deg2rad(text.rotation)
    const c = Math.cos(rot)
    const s = Math.sin(rot)

    const worldCenterX = text.pos.x + localCenterX * c - localCenterY * s
    const worldCenterY = text.pos.y + localCenterX * s + localCenterY * c

    return isPointInRect({x: worldCenterX, y: worldCenterY}, width, height, text.rotation, pt)
  }

  private getRotatedRectDimensions(ctr: Point, cur: Point): { w: number, h: number } {
    const rot = deg2rad(this.rotation)
    const dx = cur.x - ctr.x
    const dy = cur.y - ctr.y
    const localX = dx * Math.cos(rot) + dy * Math.sin(rot)
    const localY = -dx * Math.sin(rot) + dy * Math.cos(rot)
    return {w: Math.abs(localX) * 2, h: Math.abs(localY) * 2}
  }

  private getTextScale(text: string, length: number): number {
    const ctx = this.getCanvas().context
    ctx.save()
    ctx.font = `10px sans-serif`
    const metrics = ctx.measureText(text)
    ctx.restore()
    return (length / metrics.width) * 10
  }
}
