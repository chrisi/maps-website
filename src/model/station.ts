export interface Station {
  campId: number,
  ocdIdx: number,
  name: string,
  country: string,
  type: string
  posx: number,
  posy: number,
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
