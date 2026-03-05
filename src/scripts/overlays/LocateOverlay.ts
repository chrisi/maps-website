import type {Point} from "@/model/base.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import {drawHighlight} from "@/scripts/draw/basic.ts";

export class LocateOverlay extends BaseOverlay {

  private location: Point | undefined

  private highlightSize = 17; //TODO: settings

  private fac = 1 / this.global.map!.feet * this.global.map!.pixels

  public clearLocation = () => {
    this.location = undefined
    this.redraw()
  }

  public highlightStation = (ap: string): void => {
    const map = this.global.map!
    const res = map.stations.find(sta => {
      return (sta.name === ap)
    })
    if (res) {
      this.location = {x: res.pos.x * this.fac, y: this.global.map!.pixels - (res.pos.y * this.fac)}
    } else
      this.location = undefined
    this.redraw()
  }

  public onDraw(cnv: Canvas): void {
    if (!this.location) return;
    const pos = this.toCnv(this.location, cnv)
    const smartScale = cnv.scale + (1 - cnv.scale) * 0.7
    drawHighlight(cnv.context, pos, this.highlightSize * smartScale);
  }

}
