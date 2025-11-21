import {BaseOverlay} from "@/scripts/baseOverlay.ts";
import type {OverlayContext} from "@/scripts/overlay.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {watch} from "vue";
import {Mode} from "@/model/mode.ts";
import type {Point} from "@/model/base.ts";

export class BullseyeOverlay extends BaseOverlay {

  private ovlCtx: OverlayContext

  private global = useGlobalStore();
  private settings = useSettingsStore();

  private location: Point = {x: 0, y: 0}

  constructor(ovlCtx: OverlayContext) {
    console.log("initializing bullseye overlay")
    super();
    this.ovlCtx = ovlCtx;
    watch(() => this.settings.viz.be, () => {
      this.ovlCtx.redraw(1, true)
    })
    // copy only the values, not the reactive object
    this.location.x = this.settings.bullseyePos.x;
    this.location.y = this.settings.bullseyePos.y;
  }

  public onRedraw = (scale: number) => {
    if (!this.location) return;
    this.location.x *= scale;
    this.location.y *= scale;
    this.drawBullseye();
  }

  public onMouseUp = (e: MouseEvent) => {
    switch (this.global.mode) {
      case Mode.Bullseye:
        this.settings.bullseyePos = {x: e.pageX, y: e.pageY};
        this.ovlCtx.redraw(1, true)
        break;
    }
  }

  public onMouseMove = (e: MouseEvent) => {
    switch (this.global.mode) {
      case Mode.Bullseye:
        if (this.ovlCtx.isMouseDown) {
          this.location.x = e.pageX;
          this.location.y = e.pageY;
          this.ovlCtx.redraw(1, true)
        }
        break;
    }
  }

  private drawBullseye = () => {
    if (!this.settings.viz.be) return
    const ctx = this.ovlCtx.context;
    const x = this.location!.x;
    const y = this.location!.y;

    let radius = 0;

    // Set line properties
    ctx.setLineDash([]);
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;

    // Draw Radial Circles
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      radius += (30 * this.global.zoom.factor) * 6076.12 / this.global.map!.resolution;
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
