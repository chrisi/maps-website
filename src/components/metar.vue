<script setup lang="ts">
import {onUnmounted, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useGlobalStore} from "@/stores/global.ts";
import type {Point2D} from "@/model/base.ts";
import {strLatLong} from "@/scripts/conv.ts";
import {feetToLatLong} from "@/scripts/math.ts";
import type {WeatherManager} from "@/scripts/WeatherManager.ts";

const {map} = storeToRefs(useGlobalStore())
const info = ref("")

let metarTimer: ReturnType<typeof setTimeout> | undefined

const props = defineProps<{
  pos: Point2D
  wxManager: WeatherManager
}>()

watch(() => props.pos, (newPos) => {
  info.value = ""

  if (metarTimer) {
    clearTimeout(metarTimer)
  }

  metarTimer = setTimeout(() => {
    const wxTiles = 59
    const res = map.value!.pixels / wxTiles
    const x = Math.floor(newPos.x / res)
    const y = Math.floor(newPos.y / res)
    const wxTile: Point2D = {x: x, y: y}

    info.value = props.wxManager.getMETAR(wxTile)
  }, 500)
})

onUnmounted(() => {
  if (metarTimer) {
    clearTimeout(metarTimer)
  }
})
</script>

<template>
  <div id="info" v-if="info">{{ info }}</div>
</template>

<style scoped>

#info {
  pointer-events: none;
  position: fixed;
  bottom: 0;
  left: 0;
  margin: 15px;
  font-family: JetBrains Mono, monospace;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.6);
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

</style>
