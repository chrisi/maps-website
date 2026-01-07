import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";
import type {MissionManager} from "@/scripts/missionManager.ts";
import {watch} from "vue";
import {Action, type LineStpt, type Ppt, type Target} from "@/model/mission.ts";
import {drawOutlined} from "@/scripts/draw.ts";
import {midpoint, vector} from "@/scripts/math.ts";

export class RouteOverlay extends BaseOverlay {

  private missionMgr: MissionManager

  constructor(manager: OverlayManager, missionMgr: MissionManager) {
    super(manager);
    this.missionMgr = missionMgr;
    this.missionMgr.onDataCartridgeEvent(() => {
      this.redraw()
    })
    watch(() => this.settings.viz.ms, () => {
      this.redraw()
    })
  }

  public providesHotspots(): Hotspot[] {
    if (!this.missionMgr.isMissionLoaded()) return []
    return this.missionMgr.getDatacardridge().targets.map(r => {
      return {pos: {x: r.x, y: r.y}, target: r, name: r.desc, type: 'Waypoint', provider: 'RouteOverlay'}
    })
  }

  public onDraw(cnv: Canvas): void {
    if (!this.missionMgr.isMissionLoaded()) return;
    const crd = this.missionMgr.getDatacardridge()
    this.drawLineSteerPoints(cnv, crd.lines);
    this.drawPrePlannedThreats(cnv, crd.ppts);
    this.drawRoute(cnv, crd.targets);
  }

  private drawPrePlannedThreats(cnv: Canvas, list: Ppt[]) {
    const ctx = cnv.context;
    ctx.setLineDash([]);
    ctx.strokeStyle = 'red';
    ctx.fillStyle = "rgba(255, 0, 0, 0.08)";
    ctx.lineWidth = 2;
    ctx.font = '16px courier-new';
    list.forEach(ppt => {
      const p = this.toCnv(ppt);
      ctx.beginPath();
      ctx.arc(p.x, p.y, ppt.radius * cnv.scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeText(ppt.desc, p.x - 16, p.y + 8, 100);
      ctx.stroke();
    });
  }

  private drawLineSteerPoints(cnv: Canvas, list: LineStpt[]) {
    const ctx = cnv.context;
    ctx.setLineDash([15, 5]);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // Go through the line list with maximum of 5 segments
    for (let i = 1; i < list.length; i++) if ((i % 6)) {
      const p1 = this.toCnv(list[i - 1]!);
      const p2 = this.toCnv(list[i]!);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  private drawWaypoint(ctx: CanvasRenderingContext2D, waypoint: Target, id: string) {
    if ((waypoint.x > 0 || waypoint.y < this.global.map!.pixels)) {

      const wp = this.toCnv(waypoint);

      // Draw Shape based on Action
      switch (waypoint.action) {
        case Action.Target:
        case Action.CAP:
        case Action.Grnd_Attack:
        case Action.Surf_Attack:
        case Action.Strike:
        case Action.Bomb:
        case Action.SEAD:
        case Action.S_D:
        case Action.Recon:
        case Action.Sweep:
          drawOutlined(ctx, "white", "black", 3, 1, c => {
            c.moveTo(wp.x - 8, wp.y + 8);
            c.lineTo(wp.x, wp.y - 8);
            c.lineTo(wp.x + 8, wp.y + 8);
            c.lineTo(wp.x - 8, wp.y + 8);
          })
          break;
        default:
          drawOutlined(ctx, "white", "black", 3, 1, c => {
            c.arc(wp.x, wp.y, 8, 0, 2 * Math.PI);
          })
      }

      // Add Waypoint Number
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.font = '16px courier-new';
      ctx.strokeText(id, waypoint.x, waypoint.y - 16, 100);
    }
  }

  private drawRoute(cnv: Canvas, list: Target[]) {
    const ctx = cnv.context;
    let endRoute = false;
    const px2nm = 6.95; // pixel to Nm scaler //TODO: move to constants

    ctx.setLineDash([]);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'white';

    // Go through the target list.
    for (let i = 0; i < list.length - 1; i++) {
      const p1 = this.toCnv({x: list[i]!.x, y: list[i]!.y});
      const p2 = this.toCnv({x: list[i + 1]!.x, y: list[i + 1]!.y});

      if (!endRoute) {
        const vec = vector(p1, p2);
        const mid = midpoint(p1, p2)

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillRect(mid.x - 2, mid.y - 2, 4, 4);
        ctx.stroke();

        const dist = (vec.mag / px2nm / cnv.scale).toFixed(1)
        ctx.strokeText(dist, mid.x - 20, mid.y - 8, 40);

        // Only draw lines up to landing
        if (list[i + 1]!.action == 7) endRoute = true;
      }
      this.drawWaypoint(ctx, list[i]!, "" + (i + 1));
    }
  }
}
