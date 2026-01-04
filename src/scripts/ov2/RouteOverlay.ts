import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {Point} from "@/model/base.ts";
import type {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";

export class RouteOverlay extends BaseOverlay {

  private readonly route: Point[]

  constructor(manager: OverlayManager) {
    super(manager);
    this.route = [
      {x: 1000, y: 800},
      {x: 2000, y: 1500},
      {x: 2800, y: 3700},
      {x: 5600, y: 5600},
      {x: 300, y: 3800},
      {x: 1000, y: 800}
    ]
  }

  public providesHotspots(): Hotspot[] {
    let idx = 1
    return this.route.map(r => {
      return {pos: {x: r.x, y: r.y}, target: r, name: "" + idx++, type: "Waypoint"}
    })
  }

  public onDraw(cnv: Canvas): void {
    if (this.route.length < 2) return;
    const context = cnv.context;

    context.beginPath();
    context.strokeStyle = "white";
    context.lineWidth = 2;

    for (let i = 0; i < this.route.length; i++) {
      const p = this.route[i];
      if (p) {
        const tp = this.toCnv(p, cnv);

        if (i === 0) {
          context.moveTo(tp.x, tp.y);
        } else {
          context.lineTo(tp.x, tp.y);
        }
      }
    }
    context.stroke();

    for (const p of this.route) {
      this.drawWaypoint(p, cnv);
    }
  }

  private drawWaypoint(pos: Point, cnv: Canvas): void {
    const ctx = cnv.context
    const p = this.toCnv(pos, cnv);

    const size = 8;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y - size - 3);
    ctx.lineTo(p.x - size, p.y + size - 3);
    ctx.lineTo(p.x + size, p.y + size - 3);
    ctx.closePath();

    ctx.lineJoin = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
