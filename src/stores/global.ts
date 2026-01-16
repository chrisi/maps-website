import {ref} from 'vue'
import {defineStore} from 'pinia'
import {Mode} from "@/model/mode.ts";
import type {Theater} from "@/model/theater.ts";
import type {Coord, Point, Zoom} from "@/model/base.ts";
import type {Waypoint} from "@/model/mission.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";

export const useGlobalStore = defineStore('global', () => {
  const message = ref('')

  const mode = ref<Mode>(Mode.None)
  const map = ref<Theater>()

  const pos = ref<Point>({x: 0, y: 0})
  const coord = ref<Coord>({lat: 0, long: 0})

  const selectedSymbol = ref<string>()

  const currentWaypoint = ref<Waypoint>()

  const hotspots = ref<Hotspot[]>([])

  return {message, mode, map, pos, coord, selectedSymbol, currentWaypoint, hotspots}
}, {
  persist: false
})
