import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";
import {Mode} from "@/model/mode.ts";

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

    const p0_cnv = this.toCnv(this.points[0]!, cnv)

    ctx.beginPath()
    ctx.moveTo(p0_cnv.x, p0_cnv.y)

    if (this.points.length < 2 || this.isDrawing) {
      for (let i = 1; i < this.points.length; i++) {
        const p = this.toCnv(this.points[i]!, cnv)
        ctx.lineTo(p.x, p.y)
      }
    } else {
      // Smooth curve passing through all points using cardinal splines (Catmull-Rom)
      const allPts = this.points.map(p => this.toCnv(p, cnv));

      for (let i = 0; i < allPts.length - 1; i++) {
        const p0 = allPts[i === 0 ? i : i - 1]!;
        const p1 = allPts[i]!;
        const p2 = allPts[i + 1]!;
        const p3 = i + 2 < allPts.length ? allPts[i + 2]! : p2;

        const isCorner = this.cornerIndices.includes(i);
        const nextIsCorner = this.cornerIndices.includes(i + 1);

        if (isCorner || nextIsCorner) {
          // Sharp line if either end of the segment is a corner
          ctx.lineTo(p2.x, p2.y);
        } else {
          // Catmull-Rom to Cubic Bezier conversion
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
      }
    }
    ctx.stroke()

    this.drawSupportPoint(cnv)
  }

  public onPointerDown(e: PointerEvent) {
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.points = [pt]
    this.isDrawing = true
  }

  public onPointerUp(e: PointerEvent) {
    this.isDrawing = false
    this.simplifyPoints()
    this.detectCorners()
    this.redraw()
  }

  private detectCorners() {
    this.cornerIndices = []
    if (this.points.length < 3) return

    const thresholdAngle = Math.PI / 4 // 45 degrees - change in direction sharper than this is a corner

    for (let i = 1; i < this.points.length - 1; i++) {
      const pPrev = this.points[i - 1]!
      const pCurr = this.points[i]!
      const pNext = this.points[i + 1]!

      const v1 = {x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y}
      const v2 = {x: pNext.x - pCurr.x, y: pNext.y - pCurr.y}

      const angle1 = Math.atan2(v1.y, v1.x)
      const angle2 = Math.atan2(v2.y, v2.x)

      let diff = Math.abs(angle1 - angle2)
      if (diff > Math.PI) diff = 2 * Math.PI - diff

      if (diff > thresholdAngle) {
        this.cornerIndices.push(i) // actual index in allPoints
      }
    }
  }

  private simplifyPoints() {
    if (this.points.length <= 2) return

    const tolerance = 2 / (this.manager?.getCanvas().scale || 1) // Tolerance adjusted for current zoom level
    this.points = this.douglasPeucker(this.points, tolerance)
  }

  private douglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points

    let maxDistance = 0
    let index = 0
    const lastIndex = points.length - 1

    for (let i = 1; i < lastIndex; i++) {
      const distance = this.perpendicularDistance(points[i]!, points[0]!, points[lastIndex]!)
      if (distance > maxDistance) {
        maxDistance = distance
        index = i
      }
    }

    if (maxDistance > tolerance) {
      const res1 = this.douglasPeucker(points.slice(0, index + 1), tolerance)
      const res2 = this.douglasPeucker(points.slice(index), tolerance)
      return [...res1.slice(0, res1.length - 1), ...res2]
    } else {
      return [points[0]!, points[lastIndex]!]
    }
  }

  private perpendicularDistance(pt: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y

    if (dx === 0 && dy === 0) {
      return Math.sqrt(Math.pow(pt.x - lineStart.x, 2) + Math.pow(pt.y - lineStart.y, 2))
    }

    const t = ((pt.x - lineStart.x) * dx + (pt.y - lineStart.y) * dy) / (dx * dx + dy * dy)
    const nearestX = lineStart.x + t * dx
    const nearestY = lineStart.y + t * dy

    return Math.sqrt(Math.pow(pt.x - nearestX, 2) + Math.pow(pt.y - nearestY, 2))
  }

  private drawSupportPoint(cnv: Canvas) {
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
