import type {Point} from "@/model/base.ts";

export interface Visibility {
  be: boolean;
  ms: boolean;
  wx: boolean;
  wb: boolean;
  xy: boolean;
  st: boolean;
  mp: boolean;
  op: boolean;
  ow: boolean;
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

export interface AgentSettings {
  host: string;
  port: number;
}

export interface WhiteboardSettings {
  line: {
    style: string;
    color: string;
    width: number;
    opacity: number;
  }
  fill: {
    style: string;
    color: string;
    opacity: number;
  }
  text: string;
  fontSize: number;
  supportPoints: boolean;
}

export interface Settings {
  debug: boolean;
  bullseye: BullseyeSettings;
  collab: CollabSettings;
  agent: AgentSettings;
  whiteboard: WhiteboardSettings;
}
