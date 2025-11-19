import {reactive} from "vue";
import {defineStore} from "pinia";
import type {Visibility} from "@/model/settings.ts";

export const useSettingsStore = defineStore('settings', () => {
  const viz = reactive<Visibility>({
    be: false,
    ms: false,
    wx: true,
    wb: true,
    xy: true
  })

  return {viz}
})
