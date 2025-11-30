import type {Theater} from "@/model/theater.ts"
import {koreaStations} from "@/data/korea/stations.ts";
import {balkanStations} from "@/data/balkans/stations.ts";

export const cdnUrl = "https://cdn.falcon-bms.com/maps"

export const maps: Theater[] = [
  {
    name: "korea",
    datum: {lat: 38.5, long: 127.18},
    feet: 3359580,
    pixels: 3840,
    resolution: 874.890625, // feet/pixels
    // offset: 3840, // pixels
    folder: "04_KTO",
    mapFilename: "KTO_UI_Map_6k.jpeg", // native 6144
    stations: koreaStations
  },
  {
    name: "balkans",
    datum: {lat: 36.625, long: 11}, // this might be v1 map datum
    feet: 3359580,
    pixels: 3840,
    resolution: 874.890625, // feet/pixels
    // offset: 3840, // pixels
    folder: "02_Balkans",
    mapFilename: "Balkans_UI_Map_4k.png", // native 4096
    stations: balkanStations
  }
]

export const findMap = (name: string): Theater | undefined => maps.find(m => m.name === name)
