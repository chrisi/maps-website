import type {Point2D} from "@/model/base.ts";

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
  pos: Point2D;
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

export interface WeatherSettings {
  metric: boolean;
}

export interface MapSettings {
  filter: string;
}

export interface Settings {
  debug: boolean;
  bullseye: BullseyeSettings;
  collab: CollabSettings;
  agent: AgentSettings;
  weather: WeatherSettings;
  whiteboard: WhiteboardSettings;
  map: MapSettings;
}
