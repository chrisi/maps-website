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

  //clear(): void;
}

// Create an empty fmap with the default header information
export function createEmptyFmap(): Fmap {
  return {
    time: "10000Z",
    version: 0,
    changed: false,
    scaler: 1,
    dimension: {x: 0, y: 0},
    airmass: {direction: 0, speed: 0},
    turbulence: {top: 31000, bottom: 28000},
    contrail: [34000, 28000, 25000, 2000],
    cells: 0,
    type: [],
    pressure: [],
    temperature: [],
    wind: [],
    cloud: {base: [], cover: [], size: [], type: []},
    shower: [],
    visibility: [],
    fog: [],
    analytics: {
      pressure_min: 1060,
      pressure_max: 950,
      temperature_min: 50,
      temperature_max: -50
    }
  };
}
