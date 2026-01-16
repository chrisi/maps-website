import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import type {Point} from "@/model/base.ts";
import {Mode} from "@/model/mode.ts";
import {watch} from "vue";

export class BullseyeOverlay extends BaseOverlay {

  private location: Point = {x: 0, y: 0}
  private dragging = false;

  private color = '#003300'
  private radialNM = 30
  private thickness = 1

  public init() {
    const set = this.settings.settings.bullseye
    this.location = set.pos
    this.color = set.color
    this.radialNM = set.radialNM
    this.thickness = set.thickness
    watch(() => this.settings.viz.be, () => {
      this.redraw()
    })
  }

  public isEnabled(): boolean {
    return this.settings.viz.be
  }

  public getActiveMode(): Mode | undefined {
    return Mode.Bullseye
  }

  public onDraw(cnv: Canvas): void {
    if (!this.location) return;
    this.drawBullseye(cnv, this.location)
  }

  public onPointerMove(e: PointerEvent, ownHotspots: Hotspot[]) {
    if (!this.dragging) return;
    this.location = this.fromCnv({x: e.pageX, y: e.pageY})
    this.redraw()
  }

  public onPointerDown(e: PointerEvent, ownHotspots: Hotspot[]) {
    if (e.button != 0) return
    this.dragging = true;
    this.location = this.fromCnv({x: e.pageX, y: e.pageY})
    this.redraw()
  }

  public onPointerUp(e: PointerEvent, ownHotspots: Hotspot[], isClick: boolean) {
    if (e.button != 0) return
    this.dragging = false
    this.settings.settings.bullseye.pos = this.location
  }

  private drawBullseye(cnv: Canvas, pos: Point) {
    const ctx = cnv.context
    const pt = this.toCnv(pos, cnv)

    // Set line properties
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.thickness

    let radius = 0;
    // Draw Radial Circles
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      radius += this.radialNM * cnv.scale * this.global.map!.px2nm
      ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Draw Degree Lines
    radius += this.radialNM * cnv.scale * this.global.map!.px2nm / 2
    let rad = 0
    for (let i = 0; i < 12; i++) {
      ctx.beginPath()
      ctx.moveTo(pt.x, pt.y)
      ctx.lineTo(pt.x + (Math.sin(rad) * radius), pt.y - (Math.cos(rad) * radius))
      rad += (Math.PI / 6)
      ctx.stroke()
    }
  }
}
