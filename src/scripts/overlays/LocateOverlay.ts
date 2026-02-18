import {drawHighlight} from "@/common/scripts/map_draw";
import type {Point} from "@/model/base.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";

export class LocateOverlay extends BaseOverlay {

  private location: Point | undefined

  private highlightSize = 17; //TODO: settings

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
      this.location = {x: res.posx / map.stationMappingSize * map.pixels, y: res.posy / map.stationMappingSize * map.pixels}
    } else
      this.location = undefined
    this.redraw()
  }

  public onDraw(cnv: Canvas): void {
    if (!this.location) return;
    const pos = this.toCnv(this.location, cnv)
    const smartScale = cnv.scale + (1 - cnv.scale) * 0.7
    drawHighlight(cnv.context, pos.x, pos.y, this.highlightSize * smartScale);
  }

}
