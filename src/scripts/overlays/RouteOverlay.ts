import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import type {MissionManager} from "@/scripts/MissionManager.ts";
import {watch} from "vue";
import {Action, type LineStpt, type Ppt, type Target, type Waypoint} from "@/model/mission.ts";
import {drawHighlight, drawOutlined, drawTextOutlined} from "@/scripts/draw/basic.ts";
import {midpoint, vector} from "@/scripts/math.ts";
import {drawTextBoxed} from "@/scripts/draw/basic.ts";
import {pointOffsetRad} from "@/scripts/utils.ts";

export class RouteOverlay extends BaseOverlay {

  private missionMgr: MissionManager

  private highlightSize = 20; //TODO: settings

  constructor(missionMgr: MissionManager) {
    super();
    this.missionMgr = missionMgr;
  }

  public init() {
    this.missionMgr.onDataCartridgeEvent(() => {
      this.redraw()
    })
    watch(() => this.settings.viz.ms, () => {
      this.redraw()
    })
    watch(() => this.global.currentWaypoint, () => {
      this.redraw()
    })
  }

  public isEnabled(): boolean {
    return this.settings.viz.ms
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
    if (!this.missionMgr.isMissionLoaded()) return
    const crd = this.missionMgr.getDatacartridge()
    this.drawLineSteerPoints(cnv, crd.lines)
    this.drawPrePlannedThreats(cnv, crd.ppts)
    this.drawRoute(cnv, crd.targets)

    if (this.global.currentWaypoint) {
      const pos = this.toCnv(this.global.currentWaypoint.tgt, cnv)
      drawHighlight(cnv.context, pos, this.highlightSize)
    }
  }

  private drawPrePlannedThreats(cnv: Canvas, list: Ppt[]) {
    const ctx = cnv.context;
    ctx.setLineDash([]);
    ctx.font = '14px monospace';
    list.forEach(ppt => {
      const p = this.toCnv(ppt, cnv);
      ctx.strokeStyle = 'red';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ppt.radius * cnv.scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      drawTextBoxed(ctx, ppt.desc, p);

      // , '14px monospace', 'rgba(0, 0, 0, 0.5)', 'orange'
    });
  }

  private drawLineSteerPoints(cnv: Canvas, list: LineStpt[]) {
    const ctx = cnv.context;
    ctx.setLineDash([15, 5]);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // Go through the line list with maximum of 5 segments
    for (let i = 1; i < list.length; i++) if ((i % 6)) {
      const p1 = this.toCnv(list[i - 1]!, cnv);
      const p2 = this.toCnv(list[i]!, cnv);
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
          drawOutlined(ctx, c => {
            const triSize = 8
            const triOfs = 1
            c.moveTo(wp.x - triSize, wp.y + triSize - triOfs);
            c.lineTo(wp.x, wp.y - triSize - triOfs);
            c.lineTo(wp.x + triSize, wp.y + triSize - triOfs);
            c.lineTo(wp.x - triSize, wp.y + triSize - triOfs);
          }, "white", "black", 2.6, 0.6)
          break;
        default:
          drawOutlined(ctx, c => {
            c.arc(wp.x, wp.y, 7, 0, 2 * Math.PI);
          }, "white", "black", 2.6, 0.6)
      }

      // Add Waypoint Number
      //drawTextOutlined(ctx, id, wp.x + 10, wp.y - 10, "14px monospace", "#0f0");
    }
  }

  private drawRoute(cnv: Canvas, list: Target[]) {
    const ctx = cnv.context;
    let endRoute = false;
    const px2nm = 6.95; // pixel to Nm scaler //TODO: move to constants

    ctx.setLineDash([]);
    ctx.font = '14px monospace';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';

    // Go through the target list.
    for (let i = 0; i < list.length - 1; i++) {
      const p1 = this.toCnv({x: list[i]!.x, y: list[i]!.y}, cnv);
      const p2 = this.toCnv({x: list[i + 1]!.x, y: list[i + 1]!.y}, cnv);

      if (!endRoute) {
        const vec = vector(p1, p2);
        const mid = midpoint(p1, p2)

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.fillRect(mid.x - 3, mid.y - 3, 6, 6);
        ctx.stroke();

        const dist = vec.mag / px2nm / cnv.scale
        const strDist = dist >= 10 ? dist.toFixed(0) : dist.toFixed(1)

        // Omit distance if the route segment is too short on current scale to declutter UI
        if (vec.mag > 50) {
          drawTextOutlined(ctx, strDist, pointOffsetRad(mid, Math.PI, -10));
        }
        // Only draw lines up to landing
        if (list[i + 1]!.action == 7) endRoute = true;
      }
      this.drawWaypoint(ctx, list[i]!, "" + (i + 1));
    }
  }
}
