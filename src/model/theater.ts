import type {Station} from "@/model/station.ts";
import type {Position} from "@/model/base.ts";

export interface Theater {
  name: string
  projection: string
  feet: number
  pixels: number
  resolution: number
  px2nm: number
  folder: string
  mapFilename: string
  stations: Station[]
  local: boolean
  datum: Position
}
