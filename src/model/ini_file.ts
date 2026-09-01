export interface Coord {
  x: number;
  y: number;
  z: number;
}

export interface TargetCoord extends Coord {
  no: number;
  type: number;
  description: string;
}

export interface PptCoord extends Coord {
  no: number;
  range: number;
  description: string;
}

export interface LineCoord extends Coord {
  no: number;
}

export interface IniFile {
  target: TargetCoord[];
  ppt: PptCoord[];
  line: LineCoord[];
  wpnTarget: TargetCoord[];
}
