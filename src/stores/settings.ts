import {reactive, ref} from "vue";
import {defineStore} from "pinia";
import type {Visibility} from "@/model/settings.ts";
import type {Point} from "@/model/base.ts";

export const useSettingsStore = defineStore('settings', () => {
  const viz = reactive<Visibility>({
    be: false,
    ms: false,
    wx: true,
    wb: true,
    xy: true
  })

  const bullseyePos = ref<Point>({x: -1, y: -1})

  return {viz, bullseyePos}
})
