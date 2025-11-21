import {BaseOverlay} from "@/scripts/baseOverlay.ts";
import {drawHighlight} from "@/common/scripts/map_draw";
import type {Point} from "@/model/base.ts";
import type {OverlayContext} from "@/scripts/overlay.ts";
import {useGlobalStore} from "@/stores/global.ts";

export class LocateOverlay extends BaseOverlay {

  private ctx: OverlayContext

  private location: Point | undefined

  private highlightSize = 17;

  private global = useGlobalStore();

  constructor(ctx: OverlayContext) {
    console.log("initializing localte overlay")
    super();
    this.ctx = ctx;
  }

  public clearLocation = () => {
    this.location = undefined;
    this.ctx.redraw(1, true);
  }

  public locateAirbase = (ap: string): void => {
    const areas = [...this.ctx.airbaseMap.children] as HTMLAreaElement[];
    const area = areas.find(a => a.title === ap);
    if (area) {
      const coordArr = area.coords.split(',');
      const x = +coordArr[0]!;
      const y = +coordArr[1]!;

      this.location = {x, y}

      this.ctx.redraw(1, true);

      window.scrollTo(x - window.innerWidth / 2, y - window.innerHeight / 2);
    }
  }

  public onRedraw = (scale: number) => {
    this.drawLocation(scale);
  }

  private drawLocation = (scale: number) => {
    if (!this.location) return;
    this.location.x *= scale;
    this.location.y *= scale;

    drawHighlight(this.ctx.context, this.location.x, this.location.y, this.highlightSize * this.global.zoom.factor);
  }

}
