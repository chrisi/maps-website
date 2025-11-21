export interface Point {
  x: number;
  y: number;
}

export interface Coord {
  lat: number;
  long: number;
}

export interface CoordStr {
  lat: string;
  long: string;
}

export interface Zoom {
  factor: number
  speed: number
  min: number
  max: number
  wheelRate: number
}
