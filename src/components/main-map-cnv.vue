<script setup lang="ts">

import CanvasMap from "@/components/canvas-map.vue";
import SkyvectorLogo from "@/components/skyvector-logo.vue";
import {RouteOverlay} from "@/scripts/ov2/RouteOverlay.ts";
import {StationOverlay} from "@/scripts/ov2/StationOverlay.ts";
import {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";
import type {Station} from "@/model/station.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {strLatLong} from "@/scripts/conv.ts";
import type {Coord, Point} from "@/model/base.ts";
import {map2LatLong} from "@/scripts/math.ts";
import {onBeforeMount, ref, watch} from "vue";
import {findMap} from "@/data/map.ts";

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
overlayManager.registerOverlay(stationOverlay)
overlayManager.registerOverlay(routeOverlay)

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

const locateAirbase = (ap: string): Point | undefined => {
  const res = global.map!.stations.find(sta => {
    return (sta.name === ap)
  })
  if (res)
    return {x: res.posx / 4096 * 6144, y: res.posy / 4096 * 6144}
}

watch(pos, (newPos) => {
  if (newPos) {
    showPointerCoord(newPos);
  }
})

watch(dropdownName, (newValue) => {
  let point = locateAirbase(newValue);
  canvasMapRef.value.locatePosition(point, 2)
  // const ovl = ovlMgr.getOverlay(LocateOverlay)!
  // if (newValue == "") {
  //   ovl.clearLocation()
  // } else {
  //   console.log(`locating airbase '${newValue}'`)
  //   ovl.locateAirbase(newValue)
  // }
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
    <div class="title">Coords</div>
    <div>Pos: x {{ pos?.x.toFixed(2) }} / y {{ pos?.y.toFixed(2) }}</div>
    <div>Zoom: {{ zoom.toFixed(2) }}</div>
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
  height: 100px;
  width: 250px;
  color: white;
  padding: 10px;
  background-color: navy;
  opacity: 0.5;
}

.message {
  pointer-events: none;
  font-family: monospace;
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
