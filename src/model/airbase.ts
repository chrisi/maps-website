export interface Runway {
  name: string;
  type: string;
  ils: string;
}

export interface RunwayChart {
  runway: Runway;
  path: string;
  filename: string;
  filetype: string;
  page: string;
}

export interface Airbase {
  _id?: string;
  theater: string;
  key: string;
  name: string;
  icao: string;
  lat: string;
  long: string;
  elevation: string;
  runways: Runway[];
  tacan: string;
  atis: string;
  ops: string;
  ground: string;
  tower: string;
  appDep: string;
  runwayCharts: RunwayChart[];
}
