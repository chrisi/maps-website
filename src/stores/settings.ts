import {reactive, ref} from "vue";
import {defineStore} from "pinia";
import type {Settings, Visibility} from "@/model/settings.ts";

export const useSettingsStore = defineStore('settings', () => {
  const viz = reactive<Visibility>({
    be: false,
    ms: false,
    wx: true,
    wb: true,
    xy: true
  })

  const settings = reactive<Settings>(
    {bullseye: {color: 'navy', thickness: 1.5, radialNM: 30, pos: {x: -1, y: -1}}}
  )

  return {viz, settings}
})
