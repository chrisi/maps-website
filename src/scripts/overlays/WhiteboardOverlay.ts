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
    if (!this.points.length) return;
    const ctx = cnv.context
    ctx.lineWidth = 2
    ctx.strokeStyle = 'black'
    const lp = this.toCnv(this.lastPt, cnv)
    ctx.beginPath()
    ctx.moveTo(lp.x, lp.y)
    for (const pt of this.points) {
      const p = this.toCnv(pt, cnv)
      ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  }

  public onPointerDown(e: PointerEvent) {
    this.points = []
    this.lastPt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.isDrawing = true
  }

  public onPointerUp(e: PointerEvent) {
    this.isDrawing = false
  }

  public onPointerMove(e: PointerEvent) {
    if (!this.isDrawing) return;
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.points.push(pt)
    this.redraw()
  }
}
