import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Point} from "@/model/base.ts";
import {baseUrl} from "@/scripts/utils.ts";
import {vector} from "@/scripts/math.ts";
import {watch} from "vue";

export class OwnshipOverlay extends BaseOverlay {

  private pos: Point | undefined
  private heading: number = 0
  private prevWorldPos: Point | undefined
  private res = this.global.map!.resolution
  private ownship: Path2D

  constructor() {
    super();
    this.ownship = new Path2D("M 0 -32 L 3 -21 L 4 -14 L 7 -2 L 21 9 L 21 3 L 22 3 L 22 15 L 21 15 L 21 14 L 5 14 L 5 19 L 12 25 L 12 29 L 5 29 L 5 28 L 3 28 L 2 29 L -2 29 L -3 28 L -5 28 L -5 29 L -12 29 L -12 25 L -5 19 L -5 14 L -21 14 L -21 15 L -22 15 L -22 3 L -21 3 L -21 9 L -7 -2 L -4 -14 L -3 -21 Z")
  }

  public init() {
    watch(() => this.settings.viz.op, () => {
      this.redraw()
    })
  }

  public isEnabled(): boolean {
    return this.settings.viz.op
  }

  public setPosition(pos: Point) {
    if (this.prevWorldPos) {
      const v = vector(this.prevWorldPos, pos)
      this.heading = v.dir * 180 / Math.PI
    }
    this.prevWorldPos = pos
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
    const size = 32
    ctx.save()
    ctx.translate(pt.x, pt.y)
    ctx.rotate(this.heading * Math.PI / 180)
    ctx.fill(this.ownship)
    ctx.stroke(this.ownship)
    ctx.restore()
  }

}
