<script setup lang="ts">

import {ref} from "vue";
import CanvasMap from "@/components/canvas-map.vue";
import {RouteOverlay} from "@/scripts/ov2/RouteOverlay.ts";
import {StationOverlay} from "@/scripts/ov2/StationOverlay.ts";
import {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";

const xPos = ref(0)
const yPos = ref(0)
const zoom = ref(1)

const overlayManager = new OverlayManager()
const stationOverlay = new StationOverlay()
const routeOverlay = new RouteOverlay()
overlayManager.registerOverlay(stationOverlay)
overlayManager.registerOverlay(routeOverlay)

</script>

<template>
  <canvas-map
    src="https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg"
    @update:zoom="zoom = $event"
    @update:pos="(x, y) => { xPos = x; yPos = y; }"
    @redraw="(ctx, offset, scale) => overlayManager.redraw(ctx, offset, scale)"
  />
  <div id="overlay">
    <div class="title">Coords</div>
    <div>Pos: x-{{ xPos.toFixed(2) }} / y-{{ yPos.toFixed(2) }}</div>
    <div>Zoom: {{ zoom.toFixed(2) }}</div>
  </div>
</template>

<style scoped>

.title {
  font-weight: bold;
  background-color: cornflowerblue;
}

#overlay {
  position: fixed;
  top: 20px;
  left: 20px;
  height: 100px;
  width: 250px;
  color: white;
  padding: 10px;
  background-color: navy;
  opacity: 0.5;
}
</style>
