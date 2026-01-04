import {BaseOverlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {Point} from "@/model/base.ts";
import {deg2rad} from "@/scripts/math.ts";
import type {Station} from "@/model/station.ts";
import {koreaStations} from "@/data/korea/stations.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";

export class StationOverlay extends BaseOverlay {

  private stations = koreaStations.map(s => this.prepareStation(s))

  public providesHotspots(): Hotspot[] {
    return this.stations.map(s => {
      const sz = s.station.type.startsWith("VOR") ? 45 : undefined; //TODO: make 45 configurable
      return {pos: s.pt, size: sz, target: s, name: s.station.name, type: s.station.type}
    })
  }

  public onDraw(cnv: Canvas): void {
    const smartScale = cnv.scale + (0.8 - cnv.scale) * 0.7
    this.stations.forEach(sta => {
      const pt = {
        x: (sta.pt.x - cnv.offset.x) * cnv.scale,
        y: (sta.pt.y - cnv.offset.y) * cnv.scale
      }

      if (sta.station.type === 'Airbase')
        this.drawAirbase(cnv, pt, sta.orientation, smartScale, sta.doubleRwy);
      if (sta.station.type === 'VORTAC')
        this.drawVor(cnv, pt, smartScale, true);
      if (sta.station.type === 'VOR/DME')
        this.drawVor(cnv, pt, smartScale, false);
      if (sta.station.type === 'Range')
        this.drawRange(cnv, pt, smartScale);
    })
  }

  private drawAirbase(cnv: Canvas, pt: Point, orientation: number, scale: number = 1.0, dualRw: boolean = false) {
    const ctx = cnv.context;

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

    this.drawCircle(cnv, pt, rad, cbWidth, 'black', 'navy')

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

  private drawVor(cnv: Canvas, pt: Point, scale: number = 1, isTac: boolean = false) {
    const ctx = cnv.context;

    const hexRad = 7 * scale;       // Radius of the hexagon
    const tabLen = hexRad * 0.5;    // Length of the rectangular tabs
    const circleRad = hexRad * 0.3; // Radius of the center circle
    const apothem = hexRad * Math.sqrt(3) / 2; // Distance from center to side midpoint
    const strokeW = 0.8 * scale;

    ctx.save();
    ctx.translate(pt.x, pt.y);

    if (isTac) {

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
      })
    } else {


      // 1. Draw DME Box
      ctx.beginPath();
      ctx.rect(-hexRad * 1.1, -hexRad * 0.9, hexRad * 2.2, hexRad * 1.8);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.lineWidth = strokeW;
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

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

  private drawRange(cnv: Canvas, pt: Point, scale: number = 1) {
    const ctx = cnv.context;

    const ringRad = 8 * scale;
    const strokeW = 1.7 * scale;
    const crossSize = 11 * scale;

    this.drawCircle(cnv, pt, ringRad, strokeW, 'black', 'white');
    this.drawCircle(cnv, pt, ringRad * 0.6, strokeW, 'black');

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

  private drawCircle(cnv: Canvas, pt: Point, rad: number,
                     borderWidth: number = 1, strokeColor: string, fillColor?: string) {
    const ctx = cnv.context;
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

  private prepareStation(s: Station) {
    let orientation = 0
    let doubleRwy = false
    if (s.details) {
      orientation = parseInt(s.details.rwy.substring(0, 2)) * 10
      doubleRwy = s.details.rwy.includes('-')
    }
    return {
      station: s,
      pt: {x: s.posx / 4096 * 6144, y: s.posy / 4096 * 6144},
      orientation: orientation,
      doubleRwy: doubleRwy
    };
  }
}
