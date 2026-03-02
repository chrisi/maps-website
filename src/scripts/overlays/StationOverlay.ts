import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";
import type {Station} from "@/model/station.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import {watch} from "vue";
import {drawAirbase, drawNavDme, drawNavTacan, drawNavVor, drawNavVorDme} from "@/scripts/draw/symbols.ts";
import {drawCircle} from "@/scripts/draw/basic.ts";
import {MapSizeFeet} from "@/data/map.ts";

export class StationOverlay extends BaseOverlay {

  private selectStationEventHandler: ((station: Station) => void)[] = [];

  private fac = 1 / MapSizeFeet * this.global.map!.pixels

  private stations = this.global.map!.stations.map(s => this.prepareStation(s))

  public init() {
    watch(() => this.settings.viz.st, () => {
      this.redraw()
    })
  }

  public isEnabled(): boolean {
    return this.settings.viz.st
  }

  public addSelectStationEventHandler(cb: ((station: Station) => void)) {
    this.selectStationEventHandler.push(cb);
  }

  public providesHotspots(): Hotspot[] {
    return this.stations.map(s => {
      const sz = s.station.type.startsWith('VOR') ? 45 : -16; //TODO: make 45 configurable
      return {pos: s.pt, size: sz, target: s.station, name: s.station.name, type: s.station.type, provider: 'StationOverlay'}
    })
  }

  public onClickOwnHotspot(hotspots: Hotspot[]) {
    this.selectStationEventHandler.forEach(cb => cb(hotspots[0]!.target as Station))
  }

  public onDraw(cnv: Canvas): void {
    const smartScale = cnv.scale + (0.8 - cnv.scale) * 0.7
    cnv.context.setLineDash([])
    this.stations.forEach(sta => {
      const pt = this.toCnv(sta.pt, cnv)
      if (sta.station.type === 'Airbase')
        drawAirbase(cnv.context, pt, sta.orientation, smartScale, sta.doubleRwy);
      if (sta.station.type === 'Airstrip')
        drawAirbase(cnv.context, pt, sta.orientation, smartScale, false, true);
      if (sta.station.type === 'VORTAC')
        drawNavTacan(cnv.context, pt, smartScale, true)
      if (sta.station.type === 'TACAN')
        drawNavTacan(cnv.context, pt, smartScale)
      if (sta.station.type === 'VOR')
        drawNavVor(cnv.context, pt, smartScale)
      if (sta.station.type === 'DME')
        drawNavDme(cnv.context, pt, smartScale)
      if (sta.station.type === 'VOR/DME')
        drawNavVorDme(cnv.context, pt, smartScale)
      if (sta.station.type === 'Range')
        this.drawRange(cnv, pt, smartScale);
    })
  }

  private drawRange(cnv: Canvas, pt: Point, scale: number = 1) {
    const ctx = cnv.context;

    const ringRad = 8 * scale;
    const lineWidth = 1.7 * scale;
    const crossSize = 11 * scale;

    drawCircle(cnv.context, pt, ringRad, {fillStyle: 'white', strokeStyle: 'black', lineWidth: lineWidth})
    drawCircle(cnv.context, pt, ringRad * 0.6, {strokeStyle: 'black', lineWidth: lineWidth});

    ctx.save()
    ctx.translate(pt.x, pt.y)
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = 'black'
    ctx.beginPath()
    ctx.moveTo(-crossSize, 0)
    ctx.lineTo(crossSize, 0)
    ctx.moveTo(0, -crossSize)
    ctx.lineTo(0, crossSize)
    ctx.stroke()
    ctx.restore()
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
      pt: {x: s.pos.x * this.fac, y: this.global.map!.pixels - (s.pos.y * this.fac)},
      orientation: orientation,
      doubleRwy: doubleRwy
    };
  }
}
