import {Mode} from "@/model/mode.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {WbDraw, WbFreehand} from "@/model/overlays.ts";
import {drawSmoothLine} from "@/scripts/draw.ts";
import {watch} from "vue";
import {SplinePainter} from "@/scripts/SplinePainter.ts";

export class WhiteboardOverlay extends BaseOverlay {

  private freehands: WbFreehand[] = []

  private splinePainter: SplinePainter = new SplinePainter()

  public init() {
    this.imcsClient?.onDrawEvent((parts: WbDraw[]) => {
      this.addFreehand(parts[0]! as WbFreehand)
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
    this.splinePainter.draw(cnv, this.settings.settings.whiteboard)
    if (this.freehands.length == 0) return
    this.freehands.forEach(fh => {
      drawSmoothLine(cnv.context, fh.points, fh.cornerIndices, fh.color, fh.width, fh.dash, (p) => this.toCnv(p, cnv))
      if (this.settings.settings.whiteboard.supportPoints)
        this.splinePainter.drawSupportPoints(cnv, fh.points)
    })
  }

  public onPointerDown(e: PointerEvent) {
    if (e.button != 0) return // only allow left click currently, TODO: right click for delete
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.splinePainter.startDrawing(pt)
  }

  public onPointerUp(e: PointerEvent) {
    if (e.button != 0) return // only allow left click currently, TODO: right click for delete
    this.splinePainter.optimize(this.manager?.getCanvas().scale || 1)
    let fh = this.splinePainter.stopDrawing(this.settings.settings.whiteboard);
    this.addFreehand(fh)
    this.imcsClient!.msgSendDraw([fh])
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

  public onPointerMove(e: PointerEvent) {
    if (!this.splinePainter.isDrawingSpline()) return
    const pt = this.fromCnv({x: e.pageX, y: e.pageY})
    this.splinePainter.addPoint(pt)
    this.redraw()
  }
}
