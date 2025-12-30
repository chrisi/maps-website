<script setup lang="ts">

import CanvasMap from "@/components/canvas-map.vue";
import SkyvectorLogo from "@/components/skyvector-logo.vue";
import {RouteOverlay} from "@/scripts/ov2/RouteOverlay.ts";
import {StationOverlay} from "@/scripts/ov2/StationOverlay.ts";
import {LocateOverlay} from "@/scripts/ov2/LocateOverlay.ts";
import {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";
import type {Station} from "@/model/station.ts";
import type {Coord, Point} from "@/model/base.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {strLatLong} from "@/scripts/conv.ts";
import {map2LatLong} from "@/scripts/math.ts";
import {findMap} from "@/data/map.ts";
import {onBeforeMount, onMounted, ref, watch} from "vue";
import OutValue from "@/components/gui/OutValue.vue";
import OutCoord from "@/components/gui/OutCoord.vue";

const global = useGlobalStore()
const settings = useSettingsStore()

onBeforeMount(() => {
  global.map = findMap('korea')
})

const dropdownName = ref("");

const pos = ref<Point>()
const zoom = ref(1)
const canvasMapRef = ref()

const overlayManager = new OverlayManager()
const stationOverlay = new StationOverlay()
const routeOverlay = new RouteOverlay()
const locateOverlay = new LocateOverlay()

overlayManager.registerOverlay(stationOverlay)
overlayManager.registerOverlay(routeOverlay)
overlayManager.registerOverlay(locateOverlay)

onMounted(() => {
  locateOverlay.setZoomFn((pos, zoom) => canvasMapRef.value.locatePosition(pos, zoom))
})

const getStationsByCountryType = () => {
  return global.map!.stations.reduce((obj, sta) => {
    const key = `${sta.country} - ${sta.type}s`;
    if (!obj[key]) {
      obj[key] = [];
    }
    obj[key].push(sta);
    return obj;
  }, {} as Record<string, Station[]>);
}

const showPointerCoord = (pos: Point) => {
  const strCrd = strLatLong(canvasPos2LatLong(pos));
  global.message = `${strCrd.lat},${strCrd.long} | X:${pos.x.toFixed(0)},Y:${pos.y.toFixed(0)}`;
}

const canvasPos2LatLong = (point: Point): Coord => {
  const map = global.map
  if (!map) return {lat: 0, long: 0}
  const dx = point.x * map.resolution;
  const dy = (map.pixels - point.y) * map.resolution;
  return map2LatLong({lat: map.datum.lat, long: map.datum.long}, {x: dx, y: dy});
}


watch(pos, (newPos) => {
  if (newPos) {
    showPointerCoord(newPos);
  }
})

watch(dropdownName, (newValue) => {
  const ovl = overlayManager.getOverlay(LocateOverlay)!
  if (newValue == "") {
    ovl.clearLocation()
  } else {
    ovl.locateAirbase(newValue)
  }
})

</script>

<template>
  <canvas-map
    ref="canvasMapRef"
    src="https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg"
    @update:zoom="zoom = $event"
    @update:pos="pos = $event"
    @redraw="(ctx, offset, scale) => overlayManager.redraw(ctx, offset, scale)"
  />
  <div id="overlay">
    <out-value caption="Mode" :val="global.mode"/>
    <out-value caption="Zoom" :val="zoom"/>
    <out-coord v-if="pos" caption="Pos" :x="pos.x" :y="pos.y"/>
  </div>
  <div id="locate">
    <select id="selectAirbase" v-model="dropdownName" class="suspend-prevent">
      <option value=""></option>
      <optgroup v-for="(v,k) in getStationsByCountryType()" v-bind:key="k" :label="k">
        <option v-for="c in v" v-bind:key="c.name" :value="c.name">{{ c.name }}</option>
      </optgroup>
    </select>
  </div>
  <div id="cursor-val" class="message" v-if="settings.viz.xy">{{ global.message }}&nbsp;</div>
  <!--  <div id="debug" class="message">{{ debugMessage }}</div>-->
  <!--  <div id="dbgtg" class="message" v-if="global.pointerTargets.length > 0">-->
  <!--    <ul>-->
  <!--      <li v-for="(t,i) in global.pointerTargets" v-bind:key="i">{{ t.type }} {{ t.name }}</li>-->
  <!--    </ul>-->
  <!--  </div>-->
  <skyvector-logo/>
</template>

<style scoped>

.title {
  font-weight: bold;
  background-color: cornflowerblue;
}

#overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  height: 80px;
  width: 200px;
  color: white;
  padding: 5px;
  background-color: navy;
  opacity: 0.8;
  border-radius: 4px;
}

.message {
  pointer-events: none;
  font-family: JetBrains Mono, monospace;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.6);
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}


#locate {
  position: fixed;
  left: 15px;
  top: 45px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

#cursor-val {
  position: fixed;
  top: 0;
  left: 0;
  margin: 15px;
}

#dbgtg ul {
  list-style: none;
  padding: 0;
}

#dbgtg {
  width: 250px;
  margin: 15px;
  position: fixed;
  bottom: 0;
  left: 240px;
}

#dbgtg ul {
  margin: 1px;
}

#debug {
  position: fixed;
  bottom: 0;
  margin: 15px;
}


</style>
