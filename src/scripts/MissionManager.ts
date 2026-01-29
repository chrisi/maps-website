import {
  Action,
  type DataCardridge,
  type LineStpt,
  type Mission,
  type Ppt,
  type Radio,
  type Target,
  type Waypoint
} from "@/model/mission.ts";
import {useGlobalStore} from "@/stores/global.ts";
import type {Point} from "@/model/base.ts";
import {getFlightHours, map2LatLong, rad2deg, vector} from "@/scripts/math.ts";
import {getCallsignByFreq} from "@/common/scripts/map_radio";

export class MissionManager {

  private dataCartridge?: DataCardridge;
  private mission?: Mission;
  private global = useGlobalStore();

  private missionLoaded: boolean = false;

  private dataCartridgeEventHandler: ((type: string) => void)[] = [];

  public onDataCartridgeEvent(cb: ((type: string) => void)) {
    this.dataCartridgeEventHandler.push(cb);
  }

  public loadDataCartridge(title: string, ini: string[]) {
    this.dataCartridge = {
      targets: [],
      ppts: [],
      lines: [],
      radio: []
    }

    this.mission = {
      title: title,
      route: [],
      package: {
        num: 1,
        flights: [],
        chx: [15, 16, 17, 18, 19],      // Y-band positive and X-band negative
        callsign: 0,
        seat: 1,
        fuel: 7000,
        bingo: 1000
      },
      centroid: {x: 0, y: 0, n: 0},
      changed: false
    }

    ini.forEach(line => {
        if (line.startsWith('title')) this.addTitle(line)
        if (line.startsWith('ppt_')) this.addPrePlannedThreat(line);
        if (line.startsWith('lineSTPT_')) this.addLineSteerPoint(line);
        if (line.startsWith('target_')) this.addTarget(line);
        if (line.includes('HF_', 1) && !line.includes('COMMENT', 4)) this.addRadio(line);
      }
    )

    // // Now Determine Route Information
    this.initializeRoute(9, 350);
    this.initializePackage();

    this.mission!.changed = true;
    this.missionLoaded = true;

    this.dataCartridgeEventHandler.forEach(cb => cb("loaded"))
  }

  // Calculate and return the Centroid of the Mission
  public getCentroid(): Point {
    return {
      x: this.mission!.centroid.x / this.mission!.centroid.n,
      y: this.mission!.centroid.y / this.mission!.centroid.n
    }
  }

  public getSteerpointType(wp: Waypoint) {
    return (this.isTargetWaypoint(wp.tgt) ? "TGT" : "STPT");
  }

  public isMissionLoaded(): boolean {
    return this.missionLoaded;
  }

  public getMission(): Mission {
    return this.mission!;
  }

  public getDatacartridge(): DataCardridge {
    return this.dataCartridge!;
  }

  private initializeRoute(tos: number, speed: number) {
    const tgts = this.dataCartridge!.targets
    for (let i = 1; i < this.dataCartridge!.targets.length; i++) {
      const tgtFrom = tgts[i - 1]!
      const tgtTo = tgts[i]!
      const ptFrom = {x: tgtFrom.x, y: tgtFrom.y}
      const ptTo = {x: tgtTo.x, y: tgtTo.y}
      const leg = vector(ptFrom, ptTo)
      const time = getFlightHours(speed, leg.mag / this.global.map!.px2nm)
      const extra = tgtFrom.duration / 60
      const waypoint: Waypoint =
        {
          no: i,
          tgt: tgtFrom,
          tos: tos,
          dist: leg.mag / this.global.map!.px2nm,
          crs: rad2deg(leg.dir),
          spd: speed
        }

      this.mission!.route.push(waypoint)

      // Determine TOS for the next Waypoint
      tos += time + extra;
    }
  }

  private initializePackage() {
    // Check if this is Callsign.ini
    // There will be no UHF/VHF
    if (this.dataCartridge!.radio.length != 40) return;

    for (let i = 0; i < 5; i++) {
      // Set Values
      const callsign = getCallsignByFreq(this.dataCartridge!.radio[34 + i]!.freq);
      this.mission!.package.flights.push(callsign);
    }
  }

  // Parse and create ppt object
  private addPrePlannedThreat(line: string) {
    const res = this.global.map!.resolution
    const data = line.substring(line.indexOf("=") + 1).split(",");
    if (data.length < 3) return;
    const rx = parseFloat(data[1]!)
    const ry = parseFloat(data[0]!)
    if (rx == 0 && ry == 0) return;
    const ppt: Ppt = {
      x: rx / res,
      y: this.global.map!.pixels - ry / res,
      z: parseFloat(data[2]!),
      radius: parseFloat(data[3]!) / res,
      desc: (data[4] ?? "threat").trim()
    }
    this.dataCartridge!.ppts.push(ppt);
  }

  // Parse and create line object
  private addLineSteerPoint(line: string) {
    const res = this.global.map!.resolution
    const data = line.substring(line.indexOf("=") + 1).split(",");
    if (data.length < 2) return;
    const rx = parseFloat(data[1]!)
    const ry = parseFloat(data[0]!)
    if (rx == 0 && ry == 0) return;
    const lsp: LineStpt = {
      x: rx / res,
      y: this.global.map!.pixels - ry / res
    }
    this.dataCartridge!.lines.push(lsp);
  }

  // Parse and create Target object
  private addTarget(line: string) {
    const res = this.global.map!.resolution
    const data = line.substring(line.indexOf("=") + 1).split(",");
    if (data.length < 3) return;
    const rx = parseFloat(data[1]!)
    const ry = parseFloat(data[0]!)
    if (rx == 0 && ry == 0) return;
    const crd = map2LatLong(this.global.map!.datum, {x: rx, y: ry});
    const target: Target = {
      crd: crd,
      x: rx / res,
      y: this.global.map!.pixels - ry / res,
      data: parseFloat(data[2]!),
      action: parseInt(data[3]!),
      desc: data[4] ?? "Not set",
      duration: -1
    }
    target.duration = this.getTargetDuration(target.action)

    this.dataCartridge!.targets.push(target);

    // Check for addition to Centroid
    if (target.x != 0 && target.y != 0) {
      this.mission!.centroid.x += target.x;
      this.mission!.centroid.y += target.y;
      this.mission!.centroid.n += 1;
    }
  }

  // Parse and create Radio object
  private addRadio(line: string) {
    const data = line.split("=");
    const freq = (parseFloat(data[1]!) / 1000).toFixed(3);
    const entry: Radio = {
      id: data[0]!,
      freq: freq
    };
    this.dataCartridge!.radio.push(entry);
  }

  // Add title if found in file (Mission.ini)
  private addTitle(line: string) {
    this.mission!.title = line.substring(line.indexOf("=") + 1);
  }

  // Check if the waypoint index is of target type
  private isTargetWaypoint(stpt: Target): boolean {
    switch (stpt.action) {
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
        return true
      default:
        return false
    }
  }

  private getTargetDuration(action: number): number {
    switch (action) {
      case Action.CAP:
        return 15;
      case Action.Holding_Pt:
        return 4;
      case Action.Refuel:
        return 20;
      default:
        return 0;
    }
  }

  //TODO: moved here from overlay draw, better integrate once on import instead of every redraw
  private validPoint(pt: Point) {
    return (pt.x > 0 || pt.y < this.global.map!.pixels)
  }
}
