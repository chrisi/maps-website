import {drawHighlight} from "@/common/scripts/map_draw";
import type {Point} from "@/model/base.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";

export class LocateOverlay extends BaseOverlay {

  private location: Point | undefined
  private zoomFn: ((pos: Point, newScale: number) => void) | undefined

  private highlightSize = 17; //TODO: settings

  public clearLocation = () => {
    this.location = undefined
    this.redraw()
  }

  public setZoomFn = (zoomFn: (pos: Point, newScale: number) => void) => {
    this.zoomFn = zoomFn
  }

  public locateStation = (ap: string): void => {
    const res = this.global.map!.stations.find(sta => {
      return (sta.name === ap)
    })
    if (res) {
      this.location = {x: res.posx / 4096 * 6144, y: res.posy / 4096 * 6144}
      if (this.zoomFn) {
        this.zoomFn(this.location, 2)
      }
    } else
      this.location = undefined
  }

  public onDraw(cnv: Canvas): void {
    if (!this.location) return;
    const pos = this.toCnv(this.location, cnv)
    const smartScale = cnv.scale + (1 - cnv.scale) * 0.7
    drawHighlight(cnv.context, pos.x, pos.y, this.highlightSize * smartScale);
  }

}
