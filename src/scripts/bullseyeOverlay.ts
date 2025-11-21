import {BaseOverlay} from "@/scripts/baseOverlay.ts";
import {properties} from "@/scripts/properties.ts";
import type {Point} from "@/model/base.ts";
import type {OverlayContext} from "@/scripts/overlay.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {watch} from "vue";
import {Mode} from "@/model/mode.ts";

export class BullseyeOverlay extends BaseOverlay {

  private ovlCtx: OverlayContext

  private location: Point | undefined

  private global = useGlobalStore();
  private settings = useSettingsStore();

  private mouseDown = false;

  constructor(ovlCtx: OverlayContext) {
    console.log("initializing bullseye overlay")
    super();
    this.ovlCtx = ovlCtx;
    watch(() => this.settings.viz.be, () => {
      this.ovlCtx.redraw(1, true)
    })
  }

  onRedraw(scale: number) {
    if (!this.location) return;
    this.location.x *= scale;
    this.location.y *= scale;
    this.drawBullseye();
  }

  public onMouseUp = (e: MouseEvent) => {
    switch (this.global.mode) {
      case Mode.Bullseye:
        this.setBullseye(e.pageX, e.pageY);
        this.mouseDown = false //TODO: make global fremove from properties, put into state
        break;
    }
  }

  public onMouseMove = (e: MouseEvent) => {
    switch (this.global.mode) {
      case Mode.Bullseye:
        if (this.mouseDown)
          this.setBullseye(e.pageX, e.pageY);
        break;
    }
  }

  public onMouseDown = () => {
    switch (this.global.mode) {
      case Mode.Bullseye:
        this.mouseDown = true;
    }
  }

  public setBullseye = (x: number, y: number) => {
    this.location = {x: x, y: y};
    this.ovlCtx.redraw(1, true)
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
      radius += (30 * properties.zoom) * 6076.12 / this.global.map!.resolution;
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw Degree Lines
    radius += 30 * properties.zoom;
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
