import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";
import type {MissionManager} from "@/scripts/missionManager.ts";
import {watch} from "vue";
import {Action, type LineStpt, type Ppt, type Target, type Waypoint} from "@/model/mission.ts";
import {drawOutlined} from "@/scripts/draw.ts";
import {midpoint, vector} from "@/scripts/math.ts";
import {drawHighlight} from "@/common/scripts/map_draw";

export class RouteOverlay extends BaseOverlay {

  private missionMgr: MissionManager

  private highlightSize = 20; //TODO: settings

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
    let idx = 1
    return this.missionMgr.getMission().route.map(r => {
      return {pos: {x: r.tgt.x, y: r.tgt.y}, target: r, name: "" + idx++, type: 'Waypoint', provider: 'RouteOverlay'}
    })
  }

  public onClickOwnHotspot(hotspots: Hotspot[]) {
    this.global.currentWaypoint = hotspots[0]!.target as Waypoint
  }

  public onDraw(cnv: Canvas): void {
    if (!this.missionMgr.isMissionLoaded()) return;
    const crd = this.missionMgr.getDatacardridge()
    this.drawLineSteerPoints(cnv, crd.lines);
    this.drawPrePlannedThreats(cnv, crd.ppts);
    this.drawRoute(cnv, crd.targets);

    if (this.global.currentWaypoint) {
      const pos = this.toCnv(this.global.currentWaypoint.tgt, cnv)
      drawHighlight(cnv.context, pos.x, pos.y, this.highlightSize);
    }
  }

  private drawPrePlannedThreats(cnv: Canvas, list: Ppt[]) {
    const ctx = cnv.context;
    ctx.setLineDash([]);
    ctx.font = '14px monospace';
    list.forEach(ppt => {
      const p = this.toCnv(ppt);
      ctx.strokeStyle = 'red';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ppt.radius * cnv.scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeText(ppt.desc, p.x - 16, p.y + 8);

      ctx.fillStyle = 'orange';
      ctx.fillText(ppt.desc, p.x - 16, p.y + 8);
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
          drawOutlined(ctx, "white", "black", 2.6, 0.6, c => {
            const triSize = 8
            const triOfs = 1
            c.moveTo(wp.x - triSize, wp.y + triSize - triOfs);
            c.lineTo(wp.x, wp.y - triSize - triOfs);
            c.lineTo(wp.x + triSize, wp.y + triSize - triOfs);
            c.lineTo(wp.x - triSize, wp.y + triSize - triOfs);
          })
          break;
        default:
          drawOutlined(ctx, "white", "black", 2.6, 0.6, c => {
            c.arc(wp.x, wp.y, 7, 0, 2 * Math.PI);
          })
      }

      // Add Waypoint Number
      ctx.lineWidth = 1;
      ctx.font = '14px monospace';

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.strokeText(id, waypoint.x - 16, waypoint.y + 8);

      ctx.fillStyle = 'white';
      ctx.fillText(id, waypoint.x - 16, waypoint.y + 8);
    }
  }

  private drawRoute(cnv: Canvas, list: Target[]) {
    const ctx = cnv.context;
    let endRoute = false;
    const px2nm = 6.95; // pixel to Nm scaler //TODO: move to constants

    ctx.setLineDash([]);

    // Go through the target list.
    for (let i = 0; i < list.length - 1; i++) {
      const p1 = this.toCnv({x: list[i]!.x, y: list[i]!.y});
      const p2 = this.toCnv({x: list[i + 1]!.x, y: list[i + 1]!.y});

      if (!endRoute) {
        const vec = vector(p1, p2);
        const mid = midpoint(p1, p2)

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'white';

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.fillRect(mid.x - 3, mid.y - 3, 6, 6);
        ctx.stroke();

        const dist = (vec.mag / px2nm / cnv.scale).toFixed(1)

        // Omit distance if the route segment is too short on current scale to declutter UI
        if (vec.mag > 50) {
          ctx.font = '14px monospace';

          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.strokeText(dist, mid.x - 20, mid.y - 8, 40);

          ctx.fillStyle = 'white';
          ctx.fillText(dist, mid.x - 20, mid.y - 8, 40);
        }
        // Only draw lines up to landing
        if (list[i + 1]!.action == 7) endRoute = true;
      }
      this.drawWaypoint(ctx, list[i]!, "" + (i + 1));
    }
  }
}
