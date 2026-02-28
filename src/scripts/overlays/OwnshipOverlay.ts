import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Point} from "@/model/base.ts";

export class OwnshipOverlay extends BaseOverlay {

  private pos: Point | undefined
  private res = this.global.map!.resolution

  public setPosition(pos: Point) {
    this.pos = {
      x: pos.x / this.res,
      y: this.global.map!.pixels - pos.y / this.res
    }
    this.redraw()
  }

  public onDraw(cnv: Canvas): void {
    if (!this.pos) return
    const ctx = cnv.context
    const pt = this.toCnv(this.pos, cnv)
    ctx.lineWidth = 1
    ctx.strokeStyle = 'black'
    ctx.beginPath()
    ctx.fillStyle = '#9999ee'
    ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }

}
