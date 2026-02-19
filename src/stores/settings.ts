import {reactive} from "vue";
import {defineStore} from "pinia";
import type {Settings, Visibility} from "@/model/settings.ts";

export const useSettingsStore = defineStore('settings', () => {
  const viz = reactive<Visibility>({
    be: true,
    ms: true,
    wx: true,
    wb: true,
    xy: true,
    st: true,
    mp: true,
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
        line: {
          style: 'solid',
          color: '#ff0000',
          opacity: 80,
          width: 6,
        },
        fill: {
          style: 'solid',
          color: '#0088ff',
          opacity: 40
        },
        fontSize: 16,
        text: 'Hello BMS',
        supportPoints: true
      },
    }
  )

  return {viz, settings}
})
