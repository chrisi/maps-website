import type {Theater} from "@/model/theater.ts"
import {FtPerNM} from "@/scripts/math.ts";
import type { Station } from "@/model/station";
import stationsJson from "./korea/stations.json";

export const cdnUrl = "https://cdn.falcon-bms.com/maps"

export const koreaStations = stationsJson as Station[]

export const maps: Theater[] = [
  {
    name: "korea",
    datum: {lat: 38.5, long: 127.18},
    feet: 3359580, // theater size, 1024 km (3358699.5)
    pixels: 6144, // map image size
    resolution: 3359580 / 6144, // approx 546.8
    px2nm: FtPerNM / (3359580 / 6144), // approx 11.11 pixels per NM
    folder: "04_KTO",
    mapFilename: "KTO_UI_Map_6k.jpeg", // native 6144
    stations: koreaStations,
    stationMappingSize: 4096,
    local: true // load the map from own assets instead from bms cdn
  },
  {
    name: "balkans",
    datum: {lat: 36.625, long: 11}, // this might be v1 map datum
    feet: 3359580, // theater size, 1024 km
    pixels: 6144, // map image size
    resolution: 3359580 / 6144, // approx 546.8
    px2nm: FtPerNM / (3359580 / 6144), // approx 11.11 pixels per NM
    folder: "02_Balkans",
    mapFilename: "Balkans_UI_Map_6K.jpeg", // native 6144
    stations: koreaStations,
    stationMappingSize: 4096,
    local: true // load the map from own assets instead from bms cdn
  }
]

export const findMap = (name: string): Theater | undefined => maps.find(m => m.name === name)
