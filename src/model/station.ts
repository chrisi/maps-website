import type {Point} from "@/model/base.ts";

export interface Station {
  campId: number,
  ocdIdx: number,
  name: string,
  country: string,
  type: string
  pos: Point,
  details?: Details,
}

export interface Details {
  name: string;
  elev: string;
  range: string;
  rwy: string;
  tcn: string;
  atis: string;
  ops?: string;
  gnd: string;
  twr: string;
  appdep: string;
  charts?: Chart[];
}

export interface Chart {
  name: string;
  url: string;
  page?: number;
  width?: number;
  height?: number;
}
