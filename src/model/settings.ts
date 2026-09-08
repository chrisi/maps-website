import type {Point2D} from "@/model/base.ts";

export interface Visibility {
  be: boolean; // Bullseye
  ms: boolean; // Mission/Route
  wx: boolean; // Weather
  wb: boolean; // Whiteboard/Symbols
  xy: boolean; // Position
  st: boolean; // Stations
  mp: boolean; // Map
  op: boolean; // Ownship
  ow: boolean; // Owner
  mt: boolean; // METAR
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

export interface WxLayers {
  temps: boolean;
  winds: boolean;
  clouds: boolean;
  doppler: boolean;
  isobaric: boolean;
}

export interface WeatherSettings {
  metric: boolean;
  altitude: string;
  colorCloudBase: boolean;
  wxLayers: WxLayers;
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
