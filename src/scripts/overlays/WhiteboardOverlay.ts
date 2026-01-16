import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";
import {Mode} from "@/model/mode.ts";

export class WhiteboardOverlay extends BaseOverlay {

  private points: Point[] = []
  private isDrawing = false
  private lastPt: Point | undefined

  public isEnabled(): boolean {
    return this.settings.viz.wb
  }

  public getActiveMode(): Mode | undefined {
    return Mode.Whiteboard
  }

  public onDraw(cnv: Canvas): void {
    if (!this.lastPt) return;
    const ctx = cnv.context
    ctx.lineWidth = 2
    ctx.strokeStyle = 'navy'
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const lp = this.toCnv(this.lastPt, cnv)

    ctx.beginPath()
    ctx.moveTo(lp.x, lp.y)

    if (this.points.length < 2 || this.isDrawing) {
      for (const pt of this.points) {
        const p = this.toCnv(pt, cnv)
        ctx.lineTo(p.x, p.y)
      }
    } else {
      // Smooth curve approximation using quadratic curves
      let p1 = lp;
      let p2 = this.toCnv(this.points[0]!, cnv);

      for (let i = 1; i < this.points.length; i++) {
        const midPoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2
        };
        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = p2;
        p2 = this.toCnv(this.points[i]!, cnv);
      }
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke()

    // Draw small dots at the beginning of each line segment (all vertices except the last)

    ctx.lineWidth = 0.5
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'cyan'

    ctx.beginPath()
    ctx.arc(lp.x, lp.y, 3, 0, Math.PI * 2)

    for (let i = 0; i < this.points.length; i++) {
      const p = this.toCnv(this.points[i]!, cnv)
      ctx.moveTo(p.x + 2, p.y)
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.stroke()
  }

  public onPointerDown(e: PointerEvent) {
    this.points = []
    this.lastPt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.isDrawing = true
  }

  public onPointerUp(e: PointerEvent) {
    this.isDrawing = false
    this.simplifyPoints()
    this.redraw()
  }

  private simplifyPoints() {
    if (this.points.length <= 2) return;

    const tolerance = 2 / (this.manager?.getCanvas().scale || 1); // Tolerance adjusted for current zoom level
    this.points = this.douglasPeucker(this.points, tolerance);
  }

  private douglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let index = 0;
    const lastIndex = points.length - 1;

    for (let i = 1; i < lastIndex; i++) {
      const distance = this.perpendicularDistance(points[i]!, points[0]!, points[lastIndex]!);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }

    if (maxDistance > tolerance) {
      const res1 = this.douglasPeucker(points.slice(0, index + 1), tolerance);
      const res2 = this.douglasPeucker(points.slice(index), tolerance);
      return [...res1.slice(0, res1.length - 1), ...res2];
    } else {
      return [points[0], points[lastIndex]];
    }
  }

  private perpendicularDistance(pt: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    if (dx === 0 && dy === 0) {
      return Math.sqrt(Math.pow(pt.x - lineStart.x, 2) + Math.pow(pt.y - lineStart.y, 2));
    }

    const t = ((pt.x - lineStart.x) * dx + (pt.y - lineStart.y) * dy) / (dx * dx + dy * dy);
    const nearestX = lineStart.x + t * dx;
    const nearestY = lineStart.y + t * dy;

    return Math.sqrt(Math.pow(pt.x - nearestX, 2) + Math.pow(pt.y - nearestY, 2));
  }

  public onPointerMove(e: PointerEvent) {
    if (!this.isDrawing) return;
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.points.push(pt)
    this.redraw()
  }
}
