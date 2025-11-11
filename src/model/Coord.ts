export interface Coord {
  name: string,
  country: string,
  type: string
  posx: number,
  posy: number,
  size: number,
}

export interface AirbaseData {
  name: string;
  lat: string;
  long: string;
  elev: string;
  rwy: string;
  tcn: string;
  atis: string;
  ops: string;
  gnd: string;
  twr: string;
  appdep: string;
  charts: ChartData[];
}

export interface ChartData {
  name: string;
  url: string;
  page: number;
}
