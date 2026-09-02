export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface Vector {
  mag: number;
  dir: number;
}

export interface Position {
  lat: number;
  long: number;
}

export interface PositionStr {
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
