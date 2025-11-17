import type {Theater} from "@/model/theater.ts"

export const maps: Theater[] = [
  {
    name: "Balkans",
    datum: {lat: 38.5, long: 127.18},
    feet: 3359580,
    pixels: 3840,
    resolution: 874.890625, // feet/pixels
    // offset: 3840, // pixels
    mapUrl: "https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg",
    airbasesUrl: "resources/map_airbases.png"
  }
]
