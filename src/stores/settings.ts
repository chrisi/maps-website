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
    {
      debug: false,
      bullseye: {
        lineColor: 'navy',
        lineWidth: 1.5,
        radialNM: 30,
        pos: {x: -1, y: -1}
      },
      collab: {
        secure: false,
        callsign: 'Joker',
        session: '47df',
        host: 'localhost',
        port: 4848
      },
      whiteboard: {
        lineStyle: 'solid',
        lineColor: '#ff0000',
        lineWidth: 3,
        fillStyle: 'none',
        fillColor: '#ffffff',
        opacity: 40,
        eraserSize: 10,
        supportPoints: true
      },
    }
  )

  return {viz, settings}
})
