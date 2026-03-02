import type {Theater} from "@/model/theater.ts"
import {FtPerNM} from "@/scripts/math.ts";
import type {Station} from "@/model/station";
import koreaStationsJson from "./korea/stations.json";
import balkansStationsJson from "./balkans/stations.json";
import hellasStationsJson from "./hellas/stations.json";
import israelStationsJson from "./israel/stations.json";

export const cdnUrl = "https://cdn.falcon-bms.com/maps"

export const koreaStations = koreaStationsJson as Station[]
export const balkansStations = balkansStationsJson as Station[]
export const hellasStations = hellasStationsJson as Station[]
export const israelStations = israelStationsJson as Station[]

export const MapSizeFeet = 3358699.5

export const maps: Theater[] = [
  {
    name: "korea",
    datum: {lat: 38.5, long: 127.5}, // Deprecated, all lan/lon conversion is done via proj4 lib
    projection: "+proj=tmerc +lon_0=127.5 +ellps=WGS84 +k=0.9996 +units=m +x_0=512000 +y_0=-3749290",
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
    datum: {lat: 41.8327, long: 16.4191}, // Deprecated, all lan/lon conversion is done via proj4 lib
    projection: "+proj=tmerc +lon_0=16.4191 +ellps=WGS84 +k=0.9996 +units=m +x_0=512000 +y_0=-4119200",
    feet: MapSizeFeet, // theater size, 1024 km
    pixels: 6144, // map image size
    resolution: MapSizeFeet / 6144, // approx 546.8
    px2nm: FtPerNM / (MapSizeFeet / 6144), // approx 11.11 pixels per NM
    folder: "02_Balkans",
    mapFilename: "Balkans_UI_Map_6K.jpeg", // native 6144
    stations: balkansStations,
    stationMappingSize: 4096,
    local: true // load the map from own assets instead from bms cdn
  },
  {
    name: "israel",
    datum: {lat: 31.5, long: 35.0}, // Deprecated, all lan/lon conversion is done via proj4 lib
    projection: "+proj=tmerc +lon_0=35 +ellps=WGS84 +k=0.9996 +units=m +x_0=512000 +y_0=-3028440",
    feet: MapSizeFeet, // theater size, 1024 km
    pixels: 6144, // map image size
    resolution: MapSizeFeet / 6144, // approx 546.8
    px2nm: FtPerNM / (MapSizeFeet / 6144), // approx 11.11 pixels per NM
    folder: "03_ITO",
    mapFilename: "ITO_UI_Map_6K.jpeg", // native 6144
    stations: israelStations,
    stationMappingSize: 4096,
    local: true // load the map from own assets instead from bms cdn
  },
  {
    name: "hellas",
    datum: {lat: 38.0069, long: 25.0150}, // Deprecated, all lan/lon conversion is done via proj4 lib
    projection: "+proj=tmerc +lon_0=25 +ellps=WGS84 +k=0.9996 +units=m +x_0=512000 +y_0=-3693820",
    feet: MapSizeFeet, // theater size, 1024 km
    pixels: 6144, // map image size
    resolution: MapSizeFeet / 6144, // approx 546.8
    px2nm: FtPerNM / (MapSizeFeet / 6144), // approx 11.11 pixels per NM
    folder: "05_HTO", // TODO: tbd
    mapFilename: "HTO_UI_Map_6K.jpeg", // native 6144
    stations: hellasStations,
    stationMappingSize: 4096,
    local: true // load the map from own assets instead from bms cdn
  }
]

export const findMap = (name: string): Theater | undefined => maps.find(m => m.name === name)
