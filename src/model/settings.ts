import type {Point} from "@/model/base.ts";

export interface Visibility {
  be: boolean;
  ms: boolean;
  wx: boolean;
  wb: boolean;
  xy: boolean;
}

export interface BullseyeSettings {
  color: string;
  thickness: number;
  radialNM: number;
  pos: Point;
}

export interface Settings {
  bullseye: BullseyeSettings;
}
