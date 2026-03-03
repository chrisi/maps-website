import type {Station} from "@/model/station.ts";

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
}
