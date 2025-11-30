import type {Theater} from "@/model/theater.ts"
import {koreaStations} from "@/data/korea/stations.ts";
import {balkanStations} from "@/data/balkans/stations.ts";

export const maps: Theater[] = [
  {
    name: "Korea",
    datum: {lat: 38.5, long: 127.18},
    feet: 3359580,
    pixels: 3840,
    resolution: 874.890625, // feet/pixels
    // offset: 3840, // pixels
    mapUrl: "https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg", // native 6144
    stations: koreaStations
  },
  {
    name: "Balkans",
    datum: {lat: 36.625, long: 11}, // this might be v1 map datum
    feet: 3359580,
    pixels: 3840,
    resolution: 874.890625, // feet/pixels
    // offset: 3840, // pixels
    mapUrl: "https://cdn.falcon-bms.com/maps/02_Balkans/maps/Balkans_UI_Map_4k.png", // native 4096
    stations: balkanStations
  }
]
