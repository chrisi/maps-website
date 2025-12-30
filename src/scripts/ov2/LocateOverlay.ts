import {drawHighlight} from "@/common/scripts/map_draw";
import type {Point} from "@/model/base.ts";
import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";

export class LocateOverlay extends BaseOverlay {

  private location: Point | undefined
  private zoomFn: ((pos: Point, newScale: number) => void) | undefined

  constructor(zoomFn?: (pos: Point, newScale: number) => void) {
    super();
    this.zoomFn = zoomFn
  }

  private highlightSize = 17; //TODO: settings

  protected global = useGlobalStore()
  protected settings = useSettingsStore()

  public clearLocation = () => {
    this.location = undefined
  }

  public setZoomFn = (zoomFn: (pos: Point, newScale: number) => void) => {
    this.zoomFn = zoomFn
  }

  public locateAirbase = (ap: string): void => {
    console.log(`locating airbase '${ap}'`)
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

  public onRedraw(cnv: Canvas): void {
    if (!this.location) return;
    const x = (this.location.x - cnv.offset.x) * cnv.scale;
    const y = (this.location.y - cnv.offset.y) * cnv.scale;
    const smartScale = cnv.scale + (1 - cnv.scale) * 0.7
    drawHighlight(cnv.context, x, y, this.highlightSize * smartScale);
  }

}
