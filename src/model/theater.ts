import type {Coord} from "@/model/base.ts";
import type {Station} from "@/model/station.ts";

export interface Theater {
  name: string
  datum: Coord
  feet: number
  pixels: number
  resolution: number
  //offset: number // deprecated -> use pixels
  folder: string
  mapFilename: string
  stations: Station[]
  stationMappingSize: number
}
