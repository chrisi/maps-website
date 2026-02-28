<script setup lang="ts">
import {nextTick, onBeforeMount, onMounted, onUnmounted, ref, shallowRef, watch} from "vue";
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
import WhiteboardWindow from "@/components/whiteboard-window.vue";

import {ImcsClient} from "@/scripts/ImcsClient.ts";
import {MissionManager} from "@/scripts/MissionManager.ts";
import {DropFileHandler} from "@/scripts/DropFileHandler.ts";
import {OverlayMode} from "@/model/mode.ts";
import type {Theater} from "@/model/theater.ts";
import type {Station} from "@/model/station.ts";
import type {Coord, Point} from "@/model/base.ts";
import CanvasMap from "@/components/canvas-map.vue";
import MapToolbar from "@/components/map-toolbar.vue";
import HotspotList from "@/components/hotspot-list.vue";
import OutValue from "@/components/gui/OutValue.vue";
import OutCoord from "@/components/gui/OutCoord.vue";
import SkyvectorLogo from "@/components/skyvector-logo.vue";
import type {CollabSettings} from "@/model/settings.ts";
import {DebugOverlay} from "@/scripts/overlays/DebugOverlay.ts";
import {withCanvasCallCounters} from "@/scripts/utils.ts";
import axios from "axios";
import {AgentClient, type Ownship} from "@/scripts/AgentClient.ts";
import {OwnshipOverlay} from "@/scripts/overlays/OwnshipOverlay.ts";

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
const agentClient = new AgentClient();

const overlayManager = new OverlayManager(imcsClient)

const dropFileHandler = new DropFileHandler()
const missionMgr = new MissionManager()

const coords = ref("N00°00.000', E00°00.000'")

dropFileHandler.onIniLoaded((filename, content) => {
  missionMgr.loadDataCartridge(filename, content.split("\n"))
  imcsClient.msgSendMission(filename, content.split("\n"))
})

dropFileHandler.onWbLoaded((filename, content) => {
  global.whiteboard = JSON.parse(content)
  imcsClient.msgSendClear()
  imcsClient.msgSendDraw(global.whiteboard.shapes)
  imcsClient.msgSendSymbol(global.whiteboard.symbols)
  overlayManager.redraw()
})

imcsClient.onClearEvent(() => {
  global.whiteboard = {shapes: [], symbols: []}
  overlayManager.redraw()
})

imcsClient.onMissionEvent((title, ini) => {
  missionMgr.loadDataCartridge(title, ini)
})

const route = useRoute()

let inhibitLocate = false

onBeforeMount(() => {
  const name = route.params['name']
  const mapName = Array.isArray(name) ? name[0] : name
  if (mapName) {
    global.map = findMap(mapName)
  }
})

let ownShipOverlay: OwnshipOverlay

onMounted(() => {
  overlayManager.registerOverlay(new HotspotOverlay())
  overlayManager.registerOverlay(new DebugOverlay())

  overlayManager.registerOverlay(new BullseyeOverlay())

  overlayManager.registerOverlay(new StationOverlay())
    .addSelectStationEventHandler(station => {
      inhibitLocate = true
      selectedStation.value = station
      nextTick(() => inhibitLocate = false)
    })

  overlayManager.registerOverlay(new RouteOverlay(missionMgr))

  overlayManager.registerOverlay(new LocateOverlay())
  overlayManager.registerOverlay(new SymbolOverlay())
  overlayManager.registerOverlay(new MeasureOverlay())
  overlayManager.registerOverlay(new WhiteboardOverlay())
  overlayManager.registerOverlay(new PointerOverlay())
  ownShipOverlay = overlayManager.registerOverlay(new OwnshipOverlay())

  overlayManager.addRedrawEventListener(() => canvasMapRef.value.redrawOverlay())
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

agentClient.onUpdateEvent(() => {
  fetchFromLocalBms()
})

agentClient.onOpenEvent(() => {
  global.connectedAgent = true
})

agentClient.onCloseEvent(() => {
  global.connectedAgent = false
})

agentClient.onPosEvent((ownship: Ownship) => {
  ownShipOverlay.setPosition(ownship)
})

const fetchFromLocalBms = async () => {
  try {
    const response = await axios.get(`http://${settings.settings.agent.host}:${settings.settings.agent.port}/ini`)
    const ini = response.data.split('\n')
    missionMgr.loadDataCartridge('Local BMS', ini)
    zoomToMission()
  } catch (error) {
    console.error("Failed to fetch from local BMS", error)
  }
}

const zoomToMission = () => {
  const bounds = missionMgr.getBounds()
  if (bounds.min.x == bounds.max.x && bounds.min.y == bounds.max.y) return
  canvasMapRef.value.locateArea(bounds.min, bounds.max)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.code == "KeyF") {
    activeWindow.value = "locate"
    suspend.value = true
    e.preventDefault()
  }

  switch (e.key) {
    case '1':
      global.mode = OverlayMode.Measure
      suspend.value = true
      break
    case '2':
      global.mode = OverlayMode.Bullseye
      suspend.value = true
      break
    case '3':
      global.mode = OverlayMode.Whiteboard
      suspend.value = true
      break
    case 'Escape':
      global.mode = OverlayMode.Move
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
        () => overlayManager.redraw(),
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
  const strCrd = strLatLong(canvasPos2LatLong(pos))
  coords.value = `${strCrd.lat}, ${strCrd.long}`
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
    case "locate":
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
    ovl.highlightStation(newValue.name)
    if (!activeWindow.value)
      activeWindow.value = 'locate'
    if (!inhibitLocate) {
      const p = {
        x: newValue.posx / global.map!.stationMappingSize * global.map!.pixels,
        y: newValue.posy / global.map!.stationMappingSize * global.map!.pixels
      }
      canvasMapRef.value.locatePosition(p, 2)
    }
  } else {
    ovl.clearLocation()
  }
})

const settingsClick = (sender: string) => {
  if (sender == "imcs-connection") {
    if (global.connectedImcs) {
      imcsClient.disconnect()
    } else {
      imcsClient.connect(settings.settings.collab)
    }
  }
  if (sender == "agent-connection") {
    if (global.connectedAgent) {
      agentClient.disconnect()
    } else {
      agentClient.connect(settings.settings.agent)
    }
  }
}

const routeClick = (sender: string) => {
  if (sender == "zoomRoute") {
    zoomToMission()
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
  <details-popup v-model="selectedStation" :visible="activeWindow=='locate'" @close="activeWindow=''"/>
  <route-window :visible="activeWindow=='route'" :missionManager="missionMgr" @close="activeWindow=''" @btnClick="routeClick"/>
  <settings-window :visible="activeWindow=='settings'" @close="activeWindow=''" @btnClick="settingsClick"/>
  <whiteboard-window :visible="activeWindow=='whiteboard'" @close="activeWindow=''"
                     :overlayManager="overlayManager" :imcsClient="imcsClient"/>
  <div @drop="dropFileHandler.process" @dragover="dropFileHandler.allow">
    <canvas-map
      ref="canvasMapRef" v-if="global.map" :src="getMapUrl(global.map)"
      :suspend="suspend"
      :hide-map="!settings.viz.mp"
      :cursor="global.hotspots.length > 0 ? 'pointer' : 'default'"
      @update:zoom="zoom = $event"
      @update:pos="pos = $event"
      @init="(ctx) => { ovlCtx = ctx }"
      @draw="(ctx, offset, scale) => overlayManager.draw(ctx, offset, scale)"
      @pointerdown="overlayManager.onPointerDown($event)"
      @pointermove="overlayManager.onPointerMove($event)"
      @pointerup="overlayManager.onPointerUp($event)"
      @longpress="overlayManager.onLongPress($event)"
    />
  </div>
  <div id="debug" v-if="settings.settings.debug">
    <out-value caption="Tool-Window" :val="activeWindow"/>
    <out-value caption="Overlay-Mode" :val="global.mode"/>
    <out-value caption="Input-Mode" :val="global.inputMode"/>
    <out-value caption="Zoom" :val="zoom"/>
    <out-value caption="Suspended" :val="suspend.toString()"/>
    <out-coord v-if="pos" caption="Pos" :x="pos.x" :y="pos.y"/>
  </div>
  <div id="position" v-if="settings.viz.xy">{{ coords }}&nbsp;</div>
  <div id="inputs">
    <map-toolbar @toolClick="execTool" v-model="global.mode"/>
  </div>
  <hotspot-list/>
  <skyvector-logo/>
</template>

<style scoped>

#debug {
  position: fixed;
  top: 40px;
  right: 0;
  height: 120px;
  width: 240px;
  color: white;
  padding: 5px;
  margin: 15px;
  background-color: navy;
  opacity: 0.8;
  border-radius: 4px;
}

#inputs {
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  margin: 15px;
}

#position {
  pointer-events: none;
  position: fixed;
  top: 0;
  right: 0;
  margin: 15px;
  font-family: JetBrains Mono, monospace;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.6);
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

</style>
