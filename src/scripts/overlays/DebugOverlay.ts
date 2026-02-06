import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {drawTextWithBox} from "@/scripts/draw.ts";
import {watch} from "vue";

export class DebugOverlay extends BaseOverlay {

  public init() {
    watch(() => this.settings.settings.debug, () => {
      this.redraw()
    })
  }

  public isEnabled(): boolean {
    return this.settings.settings.debug
  }

  public onDraw(cnv: Canvas): void {
    const pt = this.toCnv({x: 500, y: 300}, cnv)
    drawTextWithBox(cnv.context, 'Hello World', 500, 500, '14px monospace', 'navy', 'yellow')
  }
}
