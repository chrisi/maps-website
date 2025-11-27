import type {Coord} from "@/model/base.ts";

export interface Theater {
  name: string
  datum: Coord
  feet: number
  pixels: number
  resolution: number
  //offset: number // deprecated -> use pixels
  mapUrl: string
}
