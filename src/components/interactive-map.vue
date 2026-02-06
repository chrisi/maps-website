<script setup lang="ts">
import {onBeforeMount, onMounted, onUnmounted, ref, shallowRef, watch} from "vue";
import {useRoute} from "vue-router";

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
import {PointerOverlay} from "@/scripts/overlays/PointerOverlay.ts";
import {WhiteboardOverlay} from "@/scripts/overlays/WhiteboardOverlay.ts";
//Toolwindows
import DetailsPopup from "@/components/details-popup.vue";
import SettingsWindow from "@/components/settings-window.vue";
import RouteWindow from "@/components/route-window.vue";
import SymbolsWindow from "@/components/symbols-window.vue";
import WhiteboardWindow from "@/components/whiteboard-window.vue";

import {ImcsClient} from "@/scripts/ImcsClient.ts";
import {MissionManager} from "@/scripts/MissionManager.ts";
import {DropFileHandler} from "@/scripts/DropFileHandler.ts";
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
import type {CollabSettings} from "@/model/settings.ts";
import {DebugOverlay} from "@/scripts/overlays/DebugOverlay.ts";
import {withCanvasCallCounters} from "@/scripts/utils.ts";

const global = useGlobalStore()
const settings = useSettingsStore()

const canvasMapRef = ref()

//used only for debugging
const ovlCtx = shallowRef<CanvasRenderingContext2D | null>(null)

const pos = ref<Point>()
const zoom = ref(1)
const suspend = ref(false)

const selectedStation = ref<Station | undefined>()
const activeWindow = ref('')

const imcsClient = new ImcsClient()

const overlayManager = new OverlayManager(imcsClient)

const dropFileHandler = new DropFileHandler()
const missionMgr = new MissionManager()

dropFileHandler.onIniLoaded((filename, content) => {
  missionMgr.loadDataCartridge(filename, content.split("\n"))
  imcsClient.msgSendMission(filename, content.split("\n"))
})
imcsClient.onMissionEvent((title, ini) => {
  missionMgr.loadDataCartridge(title, ini)
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

onMounted(() => {
  overlayManager.registerOverlay(new HotspotOverlay())
  overlayManager.registerOverlay(new DebugOverlay())

  overlayManager.registerOverlay(new BullseyeOverlay())

  overlayManager.registerOverlay(new StationOverlay())
    .addSelectStationEventHandler(station => selectedStation.value = station)

  overlayManager.registerOverlay(new RouteOverlay(missionMgr))

  overlayManager.registerOverlay(new LocateOverlay())
    .setZoomFn((pos, zoom) => canvasMapRef.value.locatePosition(pos, zoom))

  overlayManager.registerOverlay(new SymbolOverlay())
  overlayManager.registerOverlay(new MeasureOverlay())
  overlayManager.registerOverlay(new WhiteboardOverlay())
  overlayManager.registerOverlay(new PointerOverlay())

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
      global.mode = Mode.Whiteboard
      suspend.value = true
      break
    case 'Escape':
      global.mode = Mode.None
      activeWindow.value = ''
      selectedStation.value = undefined
      suspend.value = false
      break
    case '#':
      settings.settings.debug = !settings.settings.debug
      break
    case '+':
      const {counts} = withCanvasCallCounters(
        ovlCtx.value!,
        ['save', 'restore', 'beginPath', 'stroke', 'fill', 'fillText', 'strokeText',
          'drawImage', 'clip', 'lineWidth', 'setLineDash', 'translate', 'rotate', 'scale'],
        () => overlayManager.draw(ovlCtx.value!, {x: 0, y: 0}, 0.25),
      )
      console.table(Object.fromEntries(counts))
      break
    case 'c':
      imcsClient.connect({
        host: settings.settings.collab.host ?? "localhost",
        port: settings.settings.collab.port ?? 8080,
        secure: settings.settings.collab.secure,
        callsign: "Debug1",
        session: settings.settings.collab.session ?? "47df",
      } as CollabSettings)
      break
    case 'C':
      imcsClient.connect({
        host: settings.settings.collab.host ?? "localhost",
        port: settings.settings.collab.port ?? 8080,
        secure: settings.settings.collab.secure,
        callsign: "Debug2",
        session: settings.settings.collab.session ?? "47df",
      } as CollabSettings)
      break
    case 'd':
      imcsClient.disconnect()
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

const settingsClick = (sender: string) => {
  if (sender == "imcs-connection") {
    if (global.connected) {
      imcsClient.disconnect()
    } else {
      imcsClient.connect(settings.settings.collab)
    }
  }
}

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
  <settings-window :visible="activeWindow=='settings'" @close="activeWindow=''" @btnClick="settingsClick"/>
  <whiteboard-window :visible="activeWindow=='whiteboard'" @close="activeWindow=''"/>
  <div @drop="dropFileHandler.process" @dragover="dropFileHandler.allow">
    <canvas-map
      ref="canvasMapRef" v-if="global.map" :src="getMapUrl(global.map)"
      :suspend="suspend"
      :cursor="global.hotspots.length > 0 ? 'pointer' : 'default'"
      @update:zoom="zoom = $event"
      @update:pos="pos = $event"
      @init="(ctx) => { ovlCtx = ctx }"
      @draw="(ctx, offset, scale) => overlayManager.draw(ctx, offset, scale)"
      @pointerdown="overlayManager.onPointerDown($event)"
      @pointermove="overlayManager.onPointerMove($event)"
      @pointerup="overlayManager.onPointerUp($event)"
    />
  </div>
  <div id="debug" v-if="settings.settings.debug">
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
