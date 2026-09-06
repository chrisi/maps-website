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
    op: true,
    ow: false,
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
        secure: true,
        callsign: 'Viper',
        session: '47DF',
        host: 'collab.falcon-bms.com',
        port: 443
      },
      agent: {
        host: 'localhost',
        port: 8080
      },
      weather: {
        metric: true
      },
      map: {
        filter: '1'
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
