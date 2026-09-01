export interface StationFreq {
  _id?: string;
  theater: string;
  key: string;
  name: string;
  icao: string;
  tacan: string;
  band: string;
  towerUhf: string;
  towerVhf: string;
  runways: string[];
  ops: string;
  ground: string;
  approach: string;
  atis: string;
}
