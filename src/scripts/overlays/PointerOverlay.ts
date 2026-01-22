import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Point} from "@/model/base.ts";

export class PointerOverlay extends BaseOverlay {

  private pos: Point | undefined

  public init() {
    this.imcsClient?.onPointerEvent((pos?: Point) => {
      this.pos = pos
      this.redraw()
    })
  }

  public onDraw(cnv: Canvas): void {
    if (!this.pos) return;
    const ctx = cnv.context;
    const pt = this.toCnv(this.pos, cnv)
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.fillStyle = '#ff0000';
    ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1.0
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  public onPointerMove(e: PointerEvent) {
    if (!e.ctrlKey) {
      if (this.pos) {
        this.pos = undefined
        this.imcsClient!.msgSendPointer(this.pos)
        this.redraw()
      }
      return
    }
    this.pos = this.fromCnv({x: e.pageX, y: e.pageY})
    this.imcsClient!.msgSendPointer(this.pos)
    this.redraw()
  }
}
