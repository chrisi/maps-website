import {reactive, ref} from 'vue'
import {defineStore} from 'pinia'
import {InputMode, OverlayMode} from "@/model/mode.ts";
import type {Theater} from "@/model/theater.ts";
import type {Waypoint} from "@/model/mission.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import type {Whiteboard} from "@/model/overlays.ts";

export const useGlobalStore = defineStore('global', () => {
  const mode = ref<OverlayMode>(OverlayMode.None)
  const inputMode = ref<InputMode>(InputMode.Freehand)
  const map = ref<Theater>()
  const connectedImcs = ref(false)
  const connectedAgent = ref(false)
  const selectedSymbol = ref<string>()
  const currentWaypoint = ref<Waypoint>()
  const hotspots = ref<Hotspot[]>([])
  const whiteboard = reactive<Whiteboard>({
    shapes: [],
    symbols: []
  })

  return {mode, inputMode, map, selectedSymbol, currentWaypoint, hotspots, whiteboard, connectedImcs, connectedAgent}
}, {
  persist: false
})
