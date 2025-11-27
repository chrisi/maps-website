import {BaseOverlay} from "@/scripts/overlays/baseOverlay.ts";
import {drawHighlight} from "@/common/scripts/map_draw";
import type {Point} from "@/model/base.ts";
import type {DrawingContext, OverlayContext} from "@/scripts/overlay.ts";
import {stations} from "@/data/stations.ts";

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

  public locateAirbaseOnMap = (ap: string): void => {
    const areas = [...this.ovlCtx.airbaseMap.children] as HTMLAreaElement[];
    const area = areas.find(a => a.title === ap);
    if (area) {
      const coordArr = area.coords.split(',');
      const x = +coordArr[0]!;
      const y = +coordArr[1]!;

      this.location = {x, y}
      this.redraw()
      window.scrollTo(x - window.innerWidth / 2, y - window.innerHeight / 2);
    }
  }

  public locateAirbase = (ap: string): void => {
    stations.forEach(sta => {
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
