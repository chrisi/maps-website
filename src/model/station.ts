export interface Station {
  name: string,
  country: string,
  type: string
  posx: number,
  posy: number,
  details?: Details,
}

export interface Details {
  name: string;
  lat?: string;
  long?: string; //TODO remove
  elev: string; //TODO remove
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
