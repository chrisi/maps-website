import type {Point} from "@/model/base.ts";

export interface Visibility {
  be: boolean;
  ms: boolean;
  wx: boolean;
  wb: boolean;
  xy: boolean;
}

export interface BullseyeSettings {
  lineColor: string;
  lineWidth: number;
  radialNM: number;
  pos: Point;
}

export interface CollabSettings {
  secure: boolean;
  callsign: string;
  session: string;
  host: string;
  port: number;
}

export interface WhiteboardSettings {
  lineStyle: string;
  lineColor: string;
  lineWidth: number;
  fillStyle: string;
  fillColor: string;
  opacity: number;
  eraserSize: number;
  supportPoints: boolean;
}

export interface Settings {
  debug: boolean;
  bullseye: BullseyeSettings;
  collab: CollabSettings;
  whiteboard: WhiteboardSettings;
}
