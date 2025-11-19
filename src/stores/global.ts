import {ref} from 'vue'
import {defineStore} from 'pinia'
import {Mode} from "@/model/mode.ts";
import type {Theater} from "@/model/theater.ts";
import type {Coord, Point} from "@/model/base.ts";

export const useGlobalStore = defineStore('global', () => {
  const message = ref('')

  const mode = ref<Mode>(Mode.None)
  const map = ref<Theater | undefined>()

  const pos = ref<Point>({x: 0, y: 0})
  const coord = ref<Coord>({lat: 0, long: 0})

  return {message, mode, map, pos, coord}
}, {
  persist: false
})
