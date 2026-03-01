import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Point} from "@/model/base.ts";

export class OwnshipOverlay extends BaseOverlay {

  private pos: Point | undefined
  private res = this.global.map!.resolution
  private icon: HTMLImageElement | undefined

  public init() {
    this.icon = new Image()
    this.icon.src = 'common/icons/f16-blue.png'
    this.icon.onload = () => this.redraw()
  }

  public setPosition(pos: Point) {
    this.pos = {
      x: pos.x / this.res,
      y: this.global.map!.pixels - pos.y / this.res
    }
    this.redraw()
  }

  public onDraw(cnv: Canvas): void {
    if (!this.pos || !this.icon || !this.icon.complete) return
    const ctx = cnv.context
    const pt = this.toCnv(this.pos, cnv)

    const size = 32
    ctx.save()
    ctx.translate(pt.x, pt.y)
    //ctx.rotate(this.pos.h * Math.PI / 180)
    ctx.drawImage(this.icon, -size / 2, -size / 2, size, size)
    ctx.restore()
  }

}
