import type {Airbase} from "@/model/airbase.ts";
import type {StationFreq} from "@/model/station_freq.ts";
import type {IniFile} from "@/model/ini_file.ts";

export interface Meta {
  subject: string;
  callsign: string;
  createdAt: Date;
  filename: string;
  rawBriefing: string;
  rawIni: string;
}

export type Phase = 'dep' | 'arr' | 'alt';

export const Departure: Phase = 'dep';
export const Arrival: Phase = 'arr';
export const Alternate: Phase = 'alt';

export const Phases: Phase[] = [Departure, Arrival, Alternate];

export interface AirbaseInfo {
  airbase?: Airbase | null;
  stationFreq?: StationFreq | null;
}

export interface MissionOverview {
  flight: string;
  missionType: string;
  package: string;
  packageType: string;
  mission: string;
  target: string;
  timeOnTarget: string;
  sunriseZulu: string;
  sunriseLocal: string;
  sunsetZulu: string;
  sunsetLocal: string;
}

export interface PackageElement {
  callsign: string;
  no: number;
  role: string;
  size: number;
  aircraft: string;
  task: string;
  takeOff: string;
  push: string;
  target: string;
  iff: string;
  primary: boolean;
}

export interface Flight {
  callsign: string;
  pilots: (Pilot | null)[];
}

export interface Pilot {
  callsign: string;
  name: string;
}

export interface Steerpoint {
  no: number;
  description: string;
  time: string;
  distance: string;
  heading: string;
  cas: string;
  altitude: string;
  action: string;
  formation: string;
  comments: string;
}

export interface CommAgency {
  agency: string;
  callsign: string;
  uhfChnl?: string;
  uhfPreset?: string;
  vhfChnl?: string;
  vhfPreset?: string;
  tacan?: string;
  notes: string;
}

export interface Ordnance {
  amount: number;
  type: string;
}

export interface ElemOrdnance {
  callsign: string;
  ordnance: Ordnance[];
}

export interface FlightOrdnance {
  callsign: string;
  element: ElemOrdnance[];
}

export interface WeatherCondition {
  situation: string;
  wind: string;
  visibility: string;
  temperature: string;
  cloudBase: string;
  conLayer: string;
}

export interface Weather {
  takeOff: WeatherCondition;
  targetArea: WeatherCondition;
  landing: WeatherCondition;
}

export interface Support {
  callsign: string;
  task: string;
  aircraft: string;
  stationArea: string;
}

export interface Briefing {
  _id?: string;
  generatedAt?: Date | null;
  missionOverview?: MissionOverview | null;
  pilotRoster?: Flight[];
  packageElements?: PackageElement[];
  threatAnalysis?: string;
  steerpoints?: Steerpoint[];
  commLadder?: CommAgency[];
  ordnance?: FlightOrdnance[];
  weather?: Weather | null;
  support?: Support[];
  rulesOfEngagement?: string;
  emergencyProcedures?: string;
  airbaseInfos?: Partial<Record<Phase, AirbaseInfo>>;
  iniFile?: IniFile | null;
  meta?: Meta | null;
}
