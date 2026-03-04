import type {Theater} from "@/model/theater.ts"
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

const MapSizeFt = 3358699.5
const FtPerNM = 6076.12
const Px6k = 6144

export const maps: Theater[] = [
  {
    name: "korea",
    // defaultBullseye: {x: 1562, y: 2237},
    projection: "+proj=tmerc +lon_0=127.5 +ellps=WGS84 +k=0.9996 +units=m +x_0=512000 +y_0=-3749290",
    feet: MapSizeFt, // theater size, 1024 km (3358699.5)
    pixels: Px6k, // map image size
    resolution: MapSizeFt / Px6k, // approx 546.67
    px2nm: FtPerNM / (MapSizeFt / Px6k), // approx 11.11 pixels per NM
    folder: "04_KTO",
    mapFilename: "KTO_UI_Map_6k.jpeg", // native 6144
    stations: koreaStations,
    local: true // load the map from own assets instead from bms cdn
  },
  {
    name: "balkans",
    // defaultBullseye: {x: 1000, y: 500},
    projection: "+proj=tmerc +lon_0=16.4191 +ellps=WGS84 +k=0.9996 +units=m +x_0=512000 +y_0=-4119200",
    feet: MapSizeFt, // theater size, 1024 km
    pixels: Px6k, // map image size
    resolution: MapSizeFt / Px6k, // approx 546.67
    px2nm: FtPerNM / (MapSizeFt / Px6k), // approx 11.11 pixels per NM
    folder: "02_Balkans",
    mapFilename: "Balkans_UI_Map_6K.jpeg", // native 6144
    stations: balkansStations,
    local: true // load the map from own assets instead from bms cdn
  },
  {
    name: "israel",
    // defaultBullseye: {x: 1800, y: 1400},
    projection: "+proj=tmerc +lon_0=35 +ellps=WGS84 +k=0.9996 +units=m +x_0=512000 +y_0=-3028440",
    feet: MapSizeFt, // theater size, 1024 km
    pixels: Px6k, // map image size
    resolution: MapSizeFt / Px6k, // approx 546.67
    px2nm: FtPerNM / (MapSizeFt / Px6k), // approx 11.11 pixels per NM
    folder: "03_ITO",
    mapFilename: "ITO_UI_Map_6K.jpeg", // native 6144
    stations: israelStations,
    local: true // load the map from own assets instead from bms cdn
  },
  {
    name: "hellas",
    // defaultBullseye: {x: 1000, y: 1000},
    projection: "+proj=tmerc +lon_0=25 +ellps=WGS84 +k=0.9996 +units=m +x_0=512000 +y_0=-3693820",
    feet: MapSizeFt, // theater size, 1024 km
    pixels: Px6k, // map image size
    resolution: MapSizeFt / Px6k, // approx 546.67
    px2nm: FtPerNM / (MapSizeFt / Px6k), // approx 11.11 pixels per NM
    folder: "05_HTO", // TODO: tbd
    mapFilename: "HTO_UI_Map_6K.jpeg", // native 6144
    stations: hellasStations,
    local: true // load the map from own assets instead from bms cdn
  }
]

export const findMap = (name: string): Theater | undefined => maps.find(m => m.name === name)
