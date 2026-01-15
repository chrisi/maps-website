<script setup lang="ts">
import {onBeforeMount, onMounted, onUnmounted, ref, watch} from "vue";

import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {cdnUrl, findMap} from "@/data/map.ts";
import {strLatLong} from "@/scripts/conv.ts";
import {map2LatLong} from "@/scripts/math.ts";

// Overlays
import {OverlayManager} from "@/scripts/overlays/OverlayManager.ts";
import {RouteOverlay} from "@/scripts/overlays/RouteOverlay.ts";
import {MeasureOverlay} from "@/scripts/overlays/MeasureOverlay.ts";
import {StationOverlay} from "@/scripts/overlays/StationOverlay.ts";
import {LocateOverlay} from "@/scripts/overlays/LocateOverlay.ts";
import {HotspotOverlay} from "@/scripts/overlays/HotspotOverlay.ts";
import {SymbolOverlay} from "@/scripts/overlays/SymbolOverlay.ts";
import {BullseyeOverlay} from "@/scripts/overlays/BullseyeOverlay.ts";
//Toolwindows
import DetailsPopup from "@/components/details-popup.vue";
import SettingsWindow from "@/components/settings-window.vue";
import RouteWindow from "@/components/route-window.vue";
import SymbolsWindow from "@/components/symbols-window.vue";

import {MissionManager} from "@/scripts/missionManager.ts";
import {DropFileHandler} from "@/scripts/dropFileHandler.ts";
import {Mode} from "@/model/mode.ts";
import type {Theater} from "@/model/theater.ts";
import type {Station} from "@/model/station.ts";
import type {Coord, Point} from "@/model/base.ts";
import CanvasMap from "@/components/canvas-map.vue";
import MapToolbar from "@/components/map-toolbar.vue";
import StationSelector from "@/components/station-selector.vue";
import HotspotList from "@/components/hotspot-list.vue";
import OutValue from "@/components/gui/OutValue.vue";
import OutCoord from "@/components/gui/OutCoord.vue";
import SkyvectorLogo from "@/components/skyvector-logo.vue";
import WhiteboardWindow from "@/components/whiteboard-window.vue";
import {useRoute} from "vue-router";

const global = useGlobalStore()
const settings = useSettingsStore()

const debug = ref(false)

const canvasMapRef = ref()

const pos = ref<Point>()
const zoom = ref(1)
const suspend = ref(false)

const selectedStation = ref<Station | undefined>()
const activeWindow = ref('')

const overlayManager = new OverlayManager()

const dropFileHandler = new DropFileHandler()
const missionMgr = new MissionManager()

dropFileHandler.onIniLoaded((filename: string, content: string) => {
  missionMgr.loadDataCartridge(filename, content)
})

const route = useRoute()

onBeforeMount(() => {
  const name = route.params['name']
  const mapName = Array.isArray(name) ? name[0] : name
  if (mapName) {
    global.map = findMap(mapName)
  }
  global.message = "N00°00.000',N00°00.000' | X.0,Y:0"
})

let hotspotOvl: HotspotOverlay | undefined

onMounted(() => {
  hotspotOvl = new HotspotOverlay(overlayManager)
  hotspotOvl.setEnabled(debug.value)
  new BullseyeOverlay(overlayManager, Mode.Bullseye)
  const stationOverlay = new StationOverlay(overlayManager)
  new RouteOverlay(overlayManager, missionMgr)
  const locateOverlay = new LocateOverlay(overlayManager)
  new SymbolOverlay(overlayManager, Mode.Symbol)
  new MeasureOverlay(overlayManager, Mode.Measure)

  locateOverlay.setZoomFn((pos, zoom) => canvasMapRef.value.locatePosition(pos, zoom))
  stationOverlay.addSelectStationEventHandler(station => selectedStation.value = station)
  overlayManager.addRedrawEventListener(() => canvasMapRef.value.redrawOverlay())
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case '1':
      global.mode = Mode.Measure
      suspend.value = true
      break
    case '2':
      global.mode = Mode.Bullseye
      suspend.value = true
      break
    case '3':
      global.mode = Mode.Symbol
      suspend.value = true
      break
    case '4':
      global.mode = Mode.Draw
      suspend.value = true
      break
    case 'Escape':
      global.mode = Mode.None
      activeWindow.value = ''
      selectedStation.value = undefined
      suspend.value = false
      break
    case 'd':
      debug.value = !debug.value
      break
  }
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

const execTool = (tool: string) => {
  console.log(`activated tool '${tool}'`);
  switch (tool) {
    case "move":
      suspend.value = false
      activeWindow.value = ''
      selectedStation.value = undefined
      break;
    case "settings":
    case "route":
    case "symbol":
    case "bullseye":
    case "whiteboard":
      activeWindow.value = tool
      suspend.value = true
      break;
    case "measure":
      suspend.value = true
      break;
  }
}

watch(debug, (newValue) => {
  hotspotOvl?.setEnabled(newValue)
})

watch(pos, (newPos) => {
  if (newPos) {
    showPointerCoord(newPos);
  }
})

watch(selectedStation, (newValue) => {
  const ovl = overlayManager.getOverlay(LocateOverlay)!
  if (newValue) {
    ovl.locateStation(newValue.name)
  } else {
    ovl.clearLocation()
  }
})

watch(() => global.currentWaypoint, (newValue) => {
  if (newValue) {
    canvasMapRef.value.locatePosition({x: newValue.tgt.x, y: newValue.tgt.y})
  }
})

const getMapUrl = (map: Theater) => {
  const baseUrl = import.meta.env.BASE_URL
  if (map.local)
    return `${baseUrl}/maps/${map.mapFilename}`
  else
    return `${cdnUrl}/${map.folder}/maps/${map.mapFilename}`
}
</script>

<template>
  <details-popup :station="selectedStation" :visible="selectedStation!=undefined" @close="selectedStation=undefined"/>
  <route-window :visible="activeWindow=='route'" :missionManager="missionMgr" @close="activeWindow=''"/>
  <symbols-window :visible="activeWindow=='symbol'" @close="activeWindow=''"/>
  <settings-window :visible="activeWindow=='settings'" @close="activeWindow=''"/>
  <whiteboard-window :visible="activeWindow=='whiteboard'" @close="activeWindow=''"/>
  <div @drop="dropFileHandler.process" @dragover="dropFileHandler.allow">
    <canvas-map
      ref="canvasMapRef" v-if="global.map" :src="getMapUrl(global.map)"
      :suspend="suspend"
      :cursor="global.hotspots.length > 0 ? 'pointer' : 'default'"
      @update:zoom="zoom = $event"
      @update:pos="pos = $event"
      @draw="(ctx, offset, scale) => overlayManager.draw(ctx, offset, scale)"
      @pointerdown="overlayManager.onPointerDown($event)"
      @pointermove="overlayManager.onPointerMove($event)"
      @pointerup="overlayManager.onPointerUp($event)"
    />
  </div>
  <div id="debug" v-if="debug">
    <out-value caption="Mode" :val="global.mode"/>
    <out-value caption="Zoom" :val="zoom"/>
    <out-value caption="Suspended" :val="suspend.toString()"/>
    <out-value caption="Tool" :val="activeWindow"/>
    <out-coord v-if="pos" caption="Pos" :x="pos.x" :y="pos.y"/>
  </div>
  <div id="position" v-if="settings.viz.xy">{{ global.message }}&nbsp;</div>
  <div id="inputs">
    <station-selector id="station-select" :stations="global.map!.stations" v-model="selectedStation"/>
    <map-toolbar @toolClick="execTool" class="spacer" v-model="global.mode"/>
  </div>
  <hotspot-list/>
  <skyvector-logo/>
</template>

<style scoped>

.spacer {
  margin-top: 10px !important;
}

#debug {
  position: fixed;
  top: 20px;
  right: 20px;
  height: 86px;
  width: 200px;
  color: white;
  padding: 5px;
  background-color: navy;
  opacity: 0.8;
  border-radius: 4px;
}

#inputs {
  pointer-events: none;
  position: fixed;
  left: 15px;
  top: 45px;
}

#position {
  position: fixed;
  top: 0;
  left: 0;
  margin: 15px;

  pointer-events: none;
  font-family: JetBrains Mono, monospace;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.6);
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

</style>
