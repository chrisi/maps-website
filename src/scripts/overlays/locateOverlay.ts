import {BaseOverlay} from "@/scripts/overlays/baseOverlay.ts";
import {drawHighlight} from "@/common/scripts/map_draw";
import type {Point} from "@/model/base.ts";
import type {DrawingContext, OverlayContext} from "@/scripts/overlay.ts";

export class LocateOverlay extends BaseOverlay {

  private location: Point | undefined

  private highlightSize = 17;

  constructor(ctx: OverlayContext) {
    super(ctx);
  }

  public clearLocation = () => {
    this.location = undefined
    this.redraw()
  }

  public locateAirbase = (ap: string): void => {
    this.global.map!.stations.forEach(sta => {
      if (sta.name === ap) {
        this.location = {x: sta.posx * 2 * this.global.zoom.factor, y: sta.posy * 2 * this.global.zoom.factor}
        this.redraw()
        window.scrollTo(this.location.x - window.innerWidth / 2, this.location.y - window.innerHeight / 2);
      }
    })
  }

  public onRedraw = (dc: DrawingContext) => {
    this.drawLocation(dc);
  }

  private drawLocation = (dc: DrawingContext) => {
    if (!this.location) return;
    this.location.x *= dc.deltaScale;
    this.location.y *= dc.deltaScale;

    drawHighlight(dc.cnvCtx, this.location.x, this.location.y, this.highlightSize * dc.absScale);
  }

}
