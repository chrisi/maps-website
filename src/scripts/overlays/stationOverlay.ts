import {BaseOverlay} from "@/scripts/overlays/baseOverlay.ts";
import type {Point} from "@/model/base.ts";
import type {DrawingContext, OverlayContext} from "@/scripts/overlay.ts";
import {stations} from "@/data/stations.ts";
import type {Station} from "@/model/station.ts";
import {deg2rad, distance} from "@/scripts/math.ts";
import {Mode} from "@/model/mode.ts";

interface ScaledStation {
  station: Station
  pt: Point
  orientation: number
  doubleRwy: boolean
}

export class StationOverlay extends BaseOverlay {

  private scaledStations: ScaledStation[] = []
  private hoverStation?: Station

  private selectStationEventHandler: ((name: Station) => void)[] = [];

  public onSelectStation(cb: ((name: Station) => void)) {
    this.selectStationEventHandler.push(cb);
  }

  constructor(ctx: OverlayContext) {
    super(ctx);
  }

  private translateList(list: Station[], scale: number): ScaledStation[] {
    return list.map(pt => this.translateStation(pt, scale));
  }

  private translateStation(s: Station, scale: number): ScaledStation {
    let orientation = 0
    let doubleRwy = false
    if (s.details) {
      orientation = parseInt(s.details.rwy.substring(0, 2)) * 10
      doubleRwy = s.details.rwy.includes('-')
    }
    return {station: s, pt: {x: s.posx * 2 * scale, y: s.posy * 2 * scale}, orientation: orientation, doubleRwy: doubleRwy};
  }

  public onRedraw = (dc: DrawingContext) => {
    this.scaledStations = this.translateList(stations, dc.absScale);
    const smartScale = dc.absScale + (0.8 - dc.absScale) * 0.7
    this.scaledStations.forEach(sta => {
      if (sta.station.type === 'Airbase')
        this.drawAirbase(dc, sta.pt, sta.orientation, smartScale, sta.doubleRwy);
      if (sta.station.type === 'VORTAC')
        this.drawVortac(dc, sta.pt, smartScale);
    })
  }

  public onMouseMove = (e: MouseEvent) => {
    if (this.global.mode != Mode.None && this.global.mode != Mode.Move) return
    this.hoverStation = undefined;
    this.scaledStations.forEach(sta => {
      const d = distance(sta.pt, {x: e.pageX, y: e.pageY})
      if (d < 15 && sta.station.type == 'Airbase') {
        this.hoverStation = sta.station
      }
    })
    this.ovlCtx.canvas.style.cursor = (this.hoverStation ? "pointer" : "default")
  }

  public onClick() {
    if (this.global.mode != Mode.None && this.global.mode != Mode.Move) return
    if (this.hoverStation) {
      this.selectStationEventHandler.forEach(cb => cb(this.hoverStation!))
    }
  }

  private drawAirbase(dc: DrawingContext, pt: Point, orientation: number, scale: number = 1.0, dualRw: boolean = false) {
    const ctx = dc.cnvCtx;

    const oriRad = deg2rad(orientation + 90)

    const length = 32 * scale
    const rad = (dualRw ? 8 : 6) * scale
    const inWidth = 3 * scale
    const outWidth = 5 * scale
    const cbWidth = 1.2 * scale
    const gap = 5 * scale

    const dxo = Math.cos(oriRad) * (length / 2)
    const dyo = Math.sin(oriRad) * (length / 2)

    const dxi = Math.cos(oriRad) * ((length - 2) / 2)
    const dyi = Math.sin(oriRad) * ((length - 2) / 2)

    let offsets = [{x: 0, y: 0}];

    if (dualRw) {
      const ox = Math.cos(oriRad + Math.PI / 2) * (gap / 2);
      const oy = Math.sin(oriRad + Math.PI / 2) * (gap / 2);
      offsets = [
        {x: ox, y: oy},
        {x: -ox, y: -oy}
      ];
    }

    this.drawCircle(dc, pt, rad, cbWidth, 'black', 'navy')

    ctx.beginPath();
    offsets.forEach(function (o) {
      ctx.moveTo(pt.x + o.x - dxo, pt.y + o.y - dyo);
      ctx.lineTo(pt.x + o.x + dxo, pt.y + o.y + dyo);
    });
    ctx.lineWidth = outWidth;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    ctx.beginPath();
    offsets.forEach(function (o) {
      ctx.moveTo(pt.x + o.x - dxi, pt.y + o.y - dyi);
      ctx.lineTo(pt.x + o.x + dxi, pt.y + o.y + dyi);
    });
    ctx.lineWidth = inWidth;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  private drawVortac(dc: DrawingContext, pt: Point, scale: number = 1) {
    const ctx = dc.cnvCtx

    const hexRad = 7 * scale;       // Radius of the hexagon
    const tabLen = hexRad * 0.5;    // Length of the rectangular tabs
    const circleRad = hexRad * 0.3; // Radius of the center circle
    const apothem = hexRad * Math.sqrt(3) / 2; // Distance from center to side midpoint
    const strokeW = 0.8 * scale;

    ctx.save();
    ctx.translate(pt.x, pt.y);

    // Angles for the 3 tabs (Bottom, Top-Left, Top-Right in Canvas coordinates)
    const tabAngles = [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6]; // 90, 210, 330 degrees

    // 1. Draw the 3 Black Tabs
    ctx.fillStyle = '#000000';
    tabAngles.forEach(function (angle) {
      ctx.save();
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(apothem, -hexRad / 1.8);
      ctx.lineTo(apothem + tabLen, -hexRad / 1.8);
      ctx.lineTo(apothem + tabLen, hexRad / 1.8);
      ctx.lineTo(apothem, hexRad / 1.8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // 2. Draw White Hexagon
    ctx.beginPath();
    // Flat-topped hexagon vertices at 0, 60, 120, etc.
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3; // 0, 60, 120...
      const hx = hexRad * Math.cos(angle);
      const hy = hexRad * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // 3. Draw Center Circle
    ctx.beginPath();
    ctx.arc(0, 0, circleRad, 0, 2 * Math.PI);
    ctx.fillStyle = 'black';
    ctx.fill();

    ctx.restore();
  }

  private drawReticle(dc: DrawingContext, pt: Point, scale: number = 1) {
    const ctx = dc.cnvCtx

    const ringRad = 8 * scale;
    const strokeW = 1.7 * scale;
    const crossSize = 11 * scale;

    this.drawCircle(dc, pt, ringRad, strokeW, 'black', 'white');
    this.drawCircle(dc, pt, ringRad * 0.6, strokeW, 'black');

    // 1. Draw Center Cross
    ctx.save()
    ctx.translate(pt.x, pt.y)
    ctx.lineCap = "butt"
    ctx.lineWidth = strokeW
    ctx.strokeStyle = "black"
    ctx.beginPath()
    ctx.moveTo(-crossSize, 0)
    ctx.lineTo(crossSize, 0)
    ctx.moveTo(0, -crossSize)
    ctx.lineTo(0, crossSize)
    ctx.stroke()
    ctx.restore()
  }

  private drawCircle(dc: DrawingContext, pt: Point, rad: number,
                     borderWidth: number = 1, strokeColor: string, fillColor?: string) {
    const ctx = dc.cnvCtx
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, rad, 0, 2 * Math.PI, false);
    if (fillColor) {
      ctx.fillStyle = fillColor
      ctx.fill()
    }
    ctx.lineWidth = borderWidth
    ctx.strokeStyle = strokeColor
    ctx.stroke()
  }

}
