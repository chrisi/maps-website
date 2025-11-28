import {watch} from "vue";
import {midpoint, vector} from "@/scripts/math.ts";
import {BaseOverlay} from "@/scripts/overlays/baseOverlay.ts";
import type {Point} from "@/model/base.ts";
import type {DrawingContext, OverlayContext} from "@/scripts/overlay.ts";
import type {MissionManager} from "@/scripts/missionManager.ts";
import {Action, type LineStpt, type Ppt, type Target} from "@/model/mission.ts";
import {drawOutlined} from "@/scripts/draw.ts";

export class RouteOverlay extends BaseOverlay {

  private missionMgr: MissionManager

  constructor(ctx: OverlayContext, missionMgr: MissionManager) {
    super(ctx);
    this.missionMgr = missionMgr;
    this.missionMgr.onDataCardridgeEvent(() => {
      ctx.redraw(1, true)
    })
    watch(() => this.settings.viz.ms, () => {
      ctx.redraw(1, true)
    })
  }

  public isActive = (): boolean => {
    return this.settings.viz.ms
  }

  public onRedraw = (dc: DrawingContext) => {
    if (!this.missionMgr.isMissionLoaded()) return;

    const crd = this.missionMgr.getDatacardridge()

    const tgts = this.translateList(crd.targets, dc.absScale)
    const lines = this.translateList(crd.lines, dc.absScale)
    const ppts = this.translateList(crd.ppts, dc.absScale)

    ppts.forEach(ppt => ppt.radius *= dc.absScale);

    this.drawLineSteerPoints(dc.cnvCtx, lines)
    this.drawPrePlannedThreats(dc.cnvCtx, ppts)
    this.drawRoute(dc.cnvCtx, tgts);
  }

  private translateList<T extends Point>(list: T[], scale: number): T[] {
    return list.map(pt => this.translatePoint(pt, scale));
  }

  private translatePoint<T extends Point>(pt: T, scale: number): T {
    return {...pt, x: pt.x * scale, y: pt.y * scale};
  }

  // Draw a single Preplanned Threat
  private drawPrePlannedThreat(ctx: CanvasRenderingContext2D, ppt: Ppt) {
    if (ppt.x > 0 || ppt.y < this.global.map!.pixels || ppt.z > 0) {
      ctx.strokeStyle = 'red';
      ctx.fillStyle = "rgba(255, 0, 0, 0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ppt.x, ppt.y, ppt.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.font = '16px courier-new';
      ctx.strokeText(ppt.desc, ppt.x - 16, ppt.y + 8, 100);
      ctx.stroke();
    }
  }

  // Draw all Preplanned Threats
  private drawPrePlannedThreats(ctx: CanvasRenderingContext2D, list: Ppt[]) {
    ctx.setLineDash([]);
    for (let i = 0; i < list.length; i++) {
      this.drawPrePlannedThreat(ctx, list[i]!);
    }
  }

  // Draw Line Steer Point Segement
  private drawLineSTPT(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
    if (this.isLineSegment(from, to)) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  // Draw all Line Steer Points
  private drawLineSteerPoints(ctx: CanvasRenderingContext2D, list: LineStpt[]) {
    // Set Line Properties
    ctx.setLineDash([15, 5]);
    ctx.strokeStyle = 'black';

    // Go throug the line list with maxium of 5 segments
    for (let i = 1; i < list.length; i++) if ((i % 6)) this.drawLineSTPT(ctx, list[i - 1]!, list[i]!);
  }

  // Draw Waypoints (i.e. targets)
  private drawWaypoint(ctx: CanvasRenderingContext2D, waypoint: Target, id: string) {
    if ((waypoint.x > 0 || waypoint.y < this.global.map!.pixels)) {
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
            c.moveTo(waypoint.x - 8, waypoint.y + 8);
            c.lineTo(waypoint.x, waypoint.y - 8);
            c.lineTo(waypoint.x + 8, waypoint.y + 8);
            c.lineTo(waypoint.x - 8, waypoint.y + 8);
          })
          break;
        default:
          drawOutlined(ctx, "white", "black", 3, 1, c => {
            c.arc(waypoint.x, waypoint.y, 8, 0, 2 * Math.PI);
          })
      }

      // Add Waypoint Number
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.font = '16px courier-new';
      ctx.strokeText(id, waypoint.x, waypoint.y - 16, 100);
    }
  }

  // Draw Route
  private drawRoute(ctx: CanvasRenderingContext2D, list: Target[]) {
    let endRoute = false;
    const px2nm = 6.95; // pixel to Nm scaler //TODO: move to constants

    // Set Line Properties
    ctx.setLineDash([]);
    ctx.strokeStyle = 'white';

    // Go throug the target list.
    for (let i = 0; i < list.length - 1; i++) {

      const point1 = {x: list[i]!.x, y: list[i]!.y};
      const point2 = {x: list[i + 1]!.x, y: list[i + 1]!.y};

      if (!endRoute && this.isLineSegment(point1, point2)) {
        const vec = vector(point1, point2);
        const mid = midpoint(point1, point2)
        this.drawLineSTPT(ctx, point1, point2);
        ctx.lineWidth = 1;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.fillRect(mid.x - 3, mid.y - 3, 6, 6);
        ctx.stroke();
        ctx.strokeText((vec.mag / px2nm).toFixed(1), mid.x - 20, mid.y - 8, 40);

        // Only draw lines up to landing
        if (list[i + 1]!.action == 7) endRoute = true;
      }
      this.drawWaypoint(ctx, list[i]!, "" + (i + 1));
    }
  }

  // is the a valid line segmenst for routes and lines?
  private isLineSegment(from: Point, to: Point) {
    return ((from.x > 0 || from.y < this.global.map!.pixels) && (to.x > 0 || to.y < this.global.map!.pixels));
  }
}
