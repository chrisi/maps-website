export const Action = {
  Target: -1,
  Nav: 0,
  Takeoff: 1,
  Push: 2,
  Split: 3,
  Refuel: 4,
  Rearm: 5,
  Pickup: 6,
  Land: 7,
  Holding_Pt: 8,
  Contact: 9,
  Escort: 10,
  Sweep: 11,
  CAP: 12,
  Intercept: 13,
  Grnd_Attack: 14,
  Surf_Attack: 15,
  S_D: 16,
  Strike: 17,
  Bomb: 18,
  SEAD: 19,
  ELINT: 20,
  Recon: 21,
  Rescue: 22,
  ASW: 23,
  Fuel: 24,
  Air_Drop: 25,
  Jamming: 26,
};

export interface Radio {
  id: string,
  freq: string
}

export interface LineStpt {
  x: number,
  y: number,
}

export interface Ppt {
  x: number,
  y: number,
  z: number,
  radius: number,
  desc: string
}

export interface Target {
  x: number,
  y: number,
  data: number,
  action: number,
  desc: string,
  duration: number,
}

export interface DataCardridge {
  ppts: Ppt[]
  lines: LineStpt[]
  targets: Target[]
  radio: Radio[]
}

export interface Centroid {
  x: number,
  y: number,
  n: number,
}

export interface Waypoint {
  tos: number,
  dist: number,
  crs: number,
  spd: number
}

export interface Package {
  num: number,
  flights: string[],
  chx: number[],
  callsign: number,
  seat: number,
  fuel: number,
  bingo: number,
}

export interface Mission {
  title: string,
  centroid: Centroid,
  route: Waypoint[],
  package: Package,
  changed: boolean,
}
