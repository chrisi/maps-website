export interface FmapDimension {
  x: number;
  y: number;
}

export interface FmapVector {
  direction: number;
  speed: number;
}

export interface FmapTurbulence {
  top: number;
  bottom: number;
}

export interface FmapCloud {
  base: number[][];   // [y][x], 0 ... 10,000 ft
  cover: number[][];  // [y][x], 1 = FEW, 5 = SCT, 9 = BKN, 13 = OVC
  size: number[][];   // [y][x], 0 = largest ... 5 = smallest
  type: number[][];   // [y][x], 0 = Cumulus, 1 = Cumulonimbus
}

export interface FmapWindVelocity {
  direction: number;
  speed: number;
}

export interface FmapAnalytics {
  pressure_min: number;
  pressure_max: number;
  temperature_min: number;
  temperature_max: number;
}

export interface Fmap {
  time: string;
  version: number;
  changed: boolean;
  scaler: number;
  dimension: FmapDimension;
  airmass: FmapVector;
  turbulence: FmapTurbulence;
  contrail: number[];
  cells: number;

  type: number[][];             // [y][x] 1: Sunny, 2: Fair, 3: Poor, 4: Inclement
  pressure: number[][];         // [y][x] hPa
  temperature: number[][];      // [y][x] C
  wind: FmapWindVelocity[][][]; // [y][x][alt]

  cloud: FmapCloud;

  shower: number[][];           // [y][x] 0 = No, 1 = Yes
  visibility: number[][];       // [y][x] 0 ... 60 km
  fog: number[][];              // [y][x] 0 ... 10,000 ft

  analytics: FmapAnalytics;
}
