import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point2D} from "@/model/base.ts";
import type {Station} from "@/model/station.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import {watch} from "vue";
import {drawAirbase, drawNavDme, drawNavTacan, drawNavVor, drawNavVorDme} from "@/scripts/draw/symbols.ts";
import {drawCircle} from "@/scripts/draw/basic.ts";
import axios from "axios";

export interface Objective {
  name: string;
  owner: number;
  ocdIdx: number;
  type: number;
  pos: Point2D;
}

interface PreparedStation {
  station: Station;
  color: string;
  pt: Point2D;
  orientation: number;
  doubleRwy: boolean;
}

const colors = [
  '#ffffff', '#00ff00', '#00ffff', '#884400',
  '#ff8800', '#ffff00', '#ff0000', '#ffffff'];

export class StationOverlay extends BaseOverlay {

  private selectStationEventHandler: ((station: Station) => void)[] = [];

  private fac = 1 / this.global.map!.feet * this.global.map!.pixels

  private stations: PreparedStation[] | undefined

  private objectives: Objective[] = []

  public init() {
    watch(() => this.settings.viz.st, () => {
      this.redraw()
    })
    watch(() => this.settings.viz.ow, () => {
      this.redraw()
    })
    watch(() => this.global.connectedAgent, () => {
      if (this.global.connectedAgent)
        this.fetchOwners()
      else {
        this.stations = this.global.map!.stations.map(s => this.prepareStation(s, false))
        this.redraw()
      }

    })
    this.stations = this.global.map!.stations.map(s => this.prepareStation(s, false))
    if (this.global.connectedAgent)
      this.fetchOwners()
    this.redraw()
  }

  private fetchOwners() {
    axios.get<Objective[]>(`http://${this.settings.settings.agent.host}:${this.settings.settings.agent.port}/mission/stations`)
      .then(response => {
        this.objectives = response.data;
        this.stations = this.global.map!.stations.map(s => this.prepareStation(s, true))
        this.redraw();
      })
      .catch(error => {
        console.error('Failed to fetch objectives:', error);
      });
  }

  public isEnabled(): boolean {
    return this.settings.viz.st
  }

  public addSelectStationEventHandler(cb: ((station: Station) => void)) {
    this.selectStationEventHandler.push(cb);
  }

  public providesHotspots(): Hotspot[] {
    if (!this.stations) return []
    return this.stations.map(s => {
      const sz = s.station.type.startsWith('VOR') ? 45 : -16; //TODO: make 45 configurable
      return {pos: s.pt, size: sz, target: s.station, name: s.station.name, type: s.station.type, provider: 'StationOverlay'}
    })
  }

  public onClickOwnHotspot(hotspots: Hotspot[]) {
    this.selectStationEventHandler.forEach(cb => cb(hotspots[0]!.target as Station))
  }

  public onDraw(cnv: Canvas): void {
    const drawOwner = this.settings.viz.ow
    const smartScale = cnv.scale + (0.8 - cnv.scale) * 0.7
    cnv.context.setLineDash([])
    if (!this.stations) return
    this.stations.forEach(sta => {
      const col = drawOwner ? sta.color : 'white'
      const pt = this.toCnv(sta.pt, cnv)
      if (sta.station.type === 'Airbase')
        drawAirbase(cnv.context, pt, sta.orientation, smartScale, col, sta.doubleRwy);
      if (sta.station.type === 'Airstrip')
        drawAirbase(cnv.context, pt, sta.orientation, smartScale, col, false, true);
      if (sta.station.type === 'VORTAC')
        drawNavTacan(cnv.context, pt, smartScale, col, true)
      if (sta.station.type === 'TACAN')
        drawNavTacan(cnv.context, pt, smartScale, col)
      if (sta.station.type === 'VOR')
        drawNavVor(cnv.context, pt, smartScale, col)
      if (sta.station.type === 'DME')
        drawNavDme(cnv.context, pt, smartScale, col)
      if (sta.station.type === 'VOR/DME')
        drawNavVorDme(cnv.context, pt, smartScale, col)
      if (sta.station.type === 'Range')
        this.drawRange(cnv, pt, smartScale, col);
    })
  }

  private drawRange(cnv: Canvas, pt: Point2D, scale: number = 1, color: string = 'white') {
    const ctx = cnv.context;

    const ringRad = 8 * scale;
    const lineWidth = 1.7 * scale;
    const crossSize = 11 * scale;

    drawCircle(cnv.context, pt, ringRad, {fillStyle: color, strokeStyle: 'black', lineWidth: lineWidth})
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

  private prepareStation(s: Station, showOwner: boolean): PreparedStation {
    let orientation = 0
    let doubleRwy = false
    if (s.details) {
      orientation = parseInt(s.details.rwy.substring(0, 2)) * 10
      doubleRwy = s.details.rwy.includes('-')
    }
    return {
      station: s,
      color: showOwner ? this.getColorByColocation(s) : 'white',
      //color: showOwner ? this.getColorByOcdIdx(s) : 'white',
      pt: {x: s.pos.x * this.fac, y: this.global.map!.pixels - (s.pos.y * this.fac)},
      orientation: orientation,
      doubleRwy: doubleRwy
    }
  }

  // matching by ocdIdx inherently flawed, cannot match by class-derived props
  // in the case of nav beacons it's all 10s
  private getColorByOcdIdx(s: Station): string {
    const obj = this.objectives.find(o => o.ocdIdx == s.ocdIdx);
    return obj ? colors[obj.owner]! : 'white';
  }

  // matching by colocation seems dumb, but it works
  private getColorByColocation(s: Station, threshold: number = 1): string {
    const obj = this.objectives.find(o =>
      Math.abs(o.pos.x - s.pos.x) < threshold &&
      Math.abs(o.pos.y - s.pos.y) < threshold);
    return obj ? colors[obj.owner]! : 'white';
  }
}
