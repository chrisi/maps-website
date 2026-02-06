import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import {watch} from "vue";

export class HotspotOverlay extends BaseOverlay {

  public init() {
    watch(() => this.settings.settings.debug, () => {
      this.redraw()
    })
  }

  public isEnabled(): boolean {
    return this.settings.settings.debug
  }

  public onDraw(cnv: Canvas): void {
    const saveScale = cnv?.scale ?? 1
    cnv.context.lineWidth = 0.5
    cnv.context.fillStyle = 'rgba(255, 0, 255, 0.2)'
    cnv.context.strokeStyle = 'rgba(255, 0, 255, 0.7)'
    this.getOverlayManager().forEachHotspot(hs => {
      const sz = !hs.size ? 15 : (hs.size < 0 ? -hs.size : hs.size * saveScale) // TODO 15: make global hot spot size configurable
      const x = (hs.pos.x - cnv.offset.x) * cnv.scale
      const y = (hs.pos.y - cnv.offset.y) * cnv.scale
      cnv.context.beginPath()
      cnv.context.arc(x, y, sz, 0, 2 * Math.PI)
      cnv.context.fill()
      cnv.context.stroke()
    })
  }
}
