import {watch} from "vue";
import {BaseOverlay} from "@/scripts/overlays/baseOverlay.ts";
import {Mode} from "@/model/mode.ts";
import type {DrawingContext, OverlayContext} from "@/scripts/overlay.ts";
import type {Point} from "@/model/base.ts";

export class BullseyeOverlay extends BaseOverlay {

  private location: Point = {x: 0, y: 0}

  constructor(ctx: OverlayContext) {
    super(ctx)
    watch(() => this.settings.viz.be, () => {
      ctx.redraw(1, true)
    })
    // copy only the values, not the reactive object
    this.location.x = this.settings.bullseyePos.x
    this.location.y = this.settings.bullseyePos.y
  }

  public isActive = (): boolean => {
    return this.settings.viz.be
  }

  public onRedraw = (dc: DrawingContext) => {
    if (!this.location) return;
    this.location.x *= dc.deltaScale;
    this.location.y *= dc.deltaScale;
    this.drawBullseye(dc);
  }

  public onMouseUp = (e: MouseEvent) => {
    if (this.global.mode != Mode.Bullseye) return
    if (!this.isLeftMouse(e)) return
    this.settings.bullseyePos = {
      x: e.pageX / this.global.zoom.factor,
      y: e.pageY / this.global.zoom.factor
    }
    this.redraw()
  }

  public onMouseMove = (e: MouseEvent) => {
    if (this.global.mode != Mode.Bullseye) return
    if (!this.isLeftMouseDown()) return
    this.location.x = e.pageX
    this.location.y = e.pageY
    this.redraw()
  }

  private drawBullseye = (dc: DrawingContext) => {
    const ctx = dc.cnvCtx
    const x = this.location!.x
    const y = this.location!.y

    let radius = 0;

    // Set line properties
    ctx.setLineDash([]);
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;

    // Draw Radial Circles
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      radius += (30 * dc.absScale) * 6076.12 / this.global.map!.resolution;
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw Degree Lines
    radius += 30 * this.global.zoom.factor;
    let rad = 0;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.sin(rad) * radius), y - (Math.cos(rad) * radius));
      rad += (Math.PI / 6);
      ctx.stroke();
    }
  }

}
