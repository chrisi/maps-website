import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {drawCircle, drawTextBoxed, drawTextOutlined} from "@/scripts/draw.ts";
import {watch} from "vue";
import {pointOffsetRad} from "@/scripts/utils.ts";

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
    cnv.context.font = '14px monospace'

    const rad = Math.PI / 4

    const p1 = {x: 300, y: 300}
    const p2 = {x: 300, y: 360}
    const p2o = pointOffsetRad(p2, 0, 20)
    const p3 = {x: 500, y: 300}
    const p3o = pointOffsetRad(p3, rad, 20)

    cnv.context.strokeStyle = 'navy'
    cnv.context.lineWidth = 2
    drawTextBoxed(cnv.context, 'Hello World', p1, 0, 'navy', 'yellow', 0.5)
    drawCircle(cnv.context, p1, 2)
    drawTextBoxed(cnv.context, 'Hello World', p2o, 0, 'navy', 'yellow')
    drawCircle(cnv.context, p2, 2)
    drawTextBoxed(cnv.context, 'Hello World', p3o, rad, 'navy', 'yellow')
    drawCircle(cnv.context, p3, 2)

    drawTextOutlined(cnv.context, '10', {x: 300, y: 500})
  }
}
