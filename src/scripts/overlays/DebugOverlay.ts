import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {drawCircle, drawRect, drawTextBoxed, drawTextOutlined} from "@/scripts/draw/basic.ts";
import {watch} from "vue";
import {pointOffsetRad} from "@/scripts/utils.ts";
import {drawAirbase, drawNavDme, drawNavTacan, drawNavVor, drawNavVorDme} from "@/scripts/draw/symbols.ts";

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
    const p3 = {x: 300, y: 420}
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

    drawNavVor(cnv.context, {x: 100, y: 100}, 2)
    drawNavDme(cnv.context, {x: 150, y: 100}, 2)
    drawNavVorDme(cnv.context, {x: 200, y: 100}, 2)
    drawNavTacan(cnv.context, {x: 250, y: 100}, 2)
    drawNavTacan(cnv.context, {x: 300, y: 100}, 2, true)

    drawAirbase(cnv.context, {x: 350, y: 100}, 45, 1.5, false)
    drawAirbase(cnv.context, {x: 400, y: 100}, 45, 1.5, true)
    drawAirbase(cnv.context, {x: 450, y: 100}, 45, 1.5, false, true)

    const p = new Path2D("M 0 -32 L 3 -21 L 4 -14 L 7 -2 L 21 9 L 21 3 L 22 3 L 22 15 L 21 15 L 21 14 L 5 14 L 5 19 L 12 25 L 12 29 L 5 29 L 5 28 L 3 28 L 2 29 L -2 29 L -3 28 L -5 28 L -5 29 L -12 29 L -12 25 L -5 19 L -5 14 L -21 14 L -21 15 L -22 15 L -22 3 L -21 3 L -21 9 L -7 -2 L -4 -14 L -3 -21 Z")
    cnv.context.save()
    cnv.context.translate(500, 100)
    cnv.context.scale(1,1 )
    cnv.context.rotate(Math.PI / 4)
    cnv.context.fill(p)
    cnv.context.restore()
  }
}
