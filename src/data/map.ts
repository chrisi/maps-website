import type {Theater} from "@/model/theater.ts"
import {FtPerNM} from "@/scripts/math.ts";
import type { Station } from "@/model/station";
import koreaStationsJson from "./korea/stations.json";
import balkansStationsJson from "./balkans/stations.json";

export const cdnUrl = "https://cdn.falcon-bms.com/maps"

export const koreaStations = koreaStationsJson as Station[]
export const balkansStations = balkansStationsJson as Station[]

const MapSizeFeet = 3358699.5

export const maps: Theater[] = [
  {
    name: "korea",
    datum: {lat: 38.5, long: 127.5}, // 127.18
    feet: MapSizeFeet, // theater size, 1024 km (3358699.5)
    pixels: 6144, // map image size
    resolution: MapSizeFeet / 6144, // approx 546.8
    px2nm: FtPerNM / (MapSizeFeet / 6144), // approx 11.11 pixels per NM
    folder: "04_KTO",
    mapFilename: "KTO_UI_Map_6k.jpeg", // native 6144
    stations: koreaStations,
    stationMappingSize: 4096,
    local: true // load the map from own assets instead from bms cdn
  },
  {
    name: "balkans",
    datum: {lat: 41.8327, long: 16.4191}, // this might be v1 map datum
    feet: MapSizeFeet, // theater size, 1024 km
    pixels: 6144, // map image size
    resolution: MapSizeFeet / 6144, // approx 546.8
    px2nm: FtPerNM / (MapSizeFeet / 6144), // approx 11.11 pixels per NM
    folder: "02_Balkans",
    mapFilename: "Balkans_UI_Map_6K.jpeg", // native 6144
    stations: balkansStations,
    stationMappingSize: 4096,
    local: true // load the map from own assets instead from bms cdn
  }
]

export const findMap = (name: string): Theater | undefined => maps.find(m => m.name === name)
