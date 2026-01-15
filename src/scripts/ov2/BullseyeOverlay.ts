import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";
import type {Point} from "@/model/base.ts";

export class BullseyeOverlay extends BaseOverlay {

  private location: Point = {x: 0, y: 0}

  private dragging = false;
  private radialNm = 30

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
  }

  public onPointerUp(e: PointerEvent, ownHotspots: Hotspot[], isClick: boolean) {
    if (e.button != 0) return
    this.dragging = false;
  }

  private drawBullseye(cnv: Canvas, pos: Point) {
    const ctx = cnv.context;
    const pt = this.toCnv(pos, cnv)

    let radius = 0;

    // Set line properties
    ctx.setLineDash([]);
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;

    // Draw Radial Circles
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      radius += this.radialNm * cnv.scale * this.global.map!.px2nm;
      ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw Degree Lines
    radius += this.radialNm * cnv.scale * this.global.map!.px2nm;
    let rad = 0;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + (Math.sin(rad) * radius), pt.y - (Math.cos(rad) * radius));
      rad += (Math.PI / 6);
      ctx.stroke();
    }
  }
}
