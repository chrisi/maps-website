<script setup lang="ts">
import {nextTick, onBeforeMount, onMounted, onUnmounted, ref, shallowRef, watch} from "vue";
import {useRoute} from "vue-router";

import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {cdnUrl, findMap} from "@/data/map.ts";

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
import {OwnshipOverlay} from "@/scripts/overlays/OwnshipOverlay.ts";
import {DebugOverlay} from "@/scripts/overlays/DebugOverlay.ts";
//Toolwindows
import AipWindow from "@/components/windows/aip-window.vue";
import SettingsWindow from "@/components/windows/settings-window.vue";
import RouteWindow from "@/components/windows/route-window.vue";
import AircraftWindow from "@/components/windows/aircraft-window.vue";
import WhiteboardWindow from "@/components/windows/whiteboard-window.vue";

import {ImcsClient} from "@/scripts/ImcsClient.ts";
import {MissionManager} from "@/scripts/MissionManager.ts";
import {DropFileHandler} from "@/scripts/DropFileHandler.ts";
import type {Theater} from "@/model/theater.ts";
import type {Station} from "@/model/station.ts";
import type {Point2D, Point3D} from "@/model/base.ts";
import CanvasMap from "@/components/canvas-map.vue";
import MapToolbar from "@/components/map-toolbar.vue";
import HotspotList from "@/components/hotspot-list.vue";
import OutValue from "@/components/gui/OutValue.vue";
import OutCoord from "@/components/gui/OutCoord.vue";
import SkyvectorLogo from "@/components/skyvector-logo.vue";
import {baseUrl, withCanvasCallCounters} from "@/scripts/utils.ts";
import axios from "axios";
import {AgentClient} from "@/scripts/AgentClient.ts";
import Position from "@/components/position.vue";
import {OverlayMode} from "@/model/mode.ts";
import type {FlightData} from "@/model/flightdata.ts";

const route = useRoute()

const global = useGlobalStore()
const settings = useSettingsStore()

const canvasMapRef = ref()

//used only for debugging
const ovlCtx = shallowRef<CanvasRenderingContext2D | null>(null)

const pos = ref<Point2D>({x: 0, y: 0})
const zoom = ref(1)
const suspend = ref(false)

const selectedStation = ref<Station | undefined>()
const activeWindow = ref('')
const activeTool = ref('move')

const imcsClient = new ImcsClient()
const agentClient = new AgentClient()

const overlayManager = new OverlayManager(imcsClient)

const dropFileHandler = new DropFileHandler()
const missionMgr = new MissionManager()

let inhibitLocate = false
let ownShipOverlay: OwnshipOverlay

dropFileHandler.onIniLoaded((filename, content) => {
  missionMgr.loadDataCartridge(filename, content.split("\n"))
  imcsClient.msgSendMission(filename, content.split("\n"))
  zoomToMission()
  activeTool.value = 'route'
})

dropFileHandler.onBriefLoaded((filename, content) => {
  missionMgr.loadBriefing(filename, content)
  //TODO: send briefing to imcs or equivalent.
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

agentClient.onUpdateEvent(() => {
  fetchFromLocalBms()
})

agentClient.onOpenEvent(() => {
  global.connectedAgent = true
})

agentClient.onCloseEvent(() => {
  global.connectedAgent = false
})

agentClient.onPosEvent((ownship: Point3D) => {
  ownShipOverlay.setPosition(ownship)
})

onBeforeMount(() => {
  const name = route.params['name']
  const mapName = Array.isArray(name) ? name[0] : name
  if (mapName) {
    global.map = findMap(mapName)
  }
})

onMounted(() => {
  overlayManager.registerOverlay(new HotspotOverlay())
  overlayManager.registerOverlay(new DebugOverlay())
  overlayManager.registerOverlay(new BullseyeOverlay())
  overlayManager.registerOverlay(new StationOverlay()).addSelectStationEventHandler(station => {
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

watch(selectedStation, (newValue) => {
  const ovl = overlayManager.getOverlay(LocateOverlay)!
  const fac = 1 / global.map!.feet * global.map!.pixels
  if (newValue) {
    ovl.highlightStation(newValue.name)
    if (global.mode == 'move') {
      activeTool.value = 'locate'
    }
    if (!inhibitLocate) {
      const p = {
        x: newValue.pos.x * fac,
        y: global.map!.pixels - (newValue.pos.y * fac)
      }
      canvasMapRef.value.locatePosition(p, 2)
    }
  } else {
    ovl.clearLocation()
  }
})

watch(activeTool, (newValue) => {
  switch (newValue) {
    case 'move':
      activeWindow.value = ''
      global.mode = OverlayMode.Move
      suspend.value = false
      selectedStation.value = undefined
      break
    case 'locate':
      activeWindow.value = 'locate'
      global.mode = OverlayMode.Move
      suspend.value = false
      break
    case 'bullseye':
      activeWindow.value = ''
      global.mode = OverlayMode.Bullseye
      suspend.value = true
      break
    case 'measure':
      activeWindow.value = ''
      global.mode = OverlayMode.Measure
      suspend.value = true
      break
    case 'whiteboard':
      activeWindow.value = 'whiteboard'
      global.mode = OverlayMode.Whiteboard
      suspend.value = true
      break
    case 'route':
      activeWindow.value = 'route'
      global.mode = OverlayMode.Move
      suspend.value = false
      break
    case 'aircraft':
      activeWindow.value = 'aircraft'
      global.mode = OverlayMode.Move
      suspend.value = false
      break
    case 'settings':
      activeWindow.value = 'settings'
      global.mode = OverlayMode.Move
      suspend.value = false
      break
  }

})

const fetchFromLocalBms = async () => {
  try {
    const response = await axios.get<FlightData>(`http://${settings.settings.agent.host}:${settings.settings.agent.port}/flight`)
    console.log("loading flight data for " + response.data.callsign)
    missionMgr.loadBriefing('Local BMS', response.data.briefing)
    missionMgr.loadDataCartridge('Local BMS', response.data.ini.split('\n'))
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
  switch (e.key) {
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
  }
}

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
  if (map.local)
    return `${baseUrl}/maps/${map.mapFilename}`
  else
    return `${cdnUrl}/${map.folder}/maps/${map.mapFilename}`
}
</script>

<template>
  <position v-if="settings.viz.xy" :pos="pos"/>
  <map-toolbar v-model="activeTool"/>
  <aip-window v-model="selectedStation" :visible="activeWindow=='locate'" @close="activeWindow=''"/>
  <route-window :visible="activeWindow=='route'" :missionManager="missionMgr" @close="activeWindow=''" @btnClick="routeClick"/>
  <whiteboard-window :visible="activeWindow=='whiteboard'" @close="activeWindow=''" :overlayManager="overlayManager"
                     :imcsClient="imcsClient"/>
  <aircraft-window :visible="activeWindow=='aircraft'" @close="activeWindow=''"/>
  <settings-window :visible="activeWindow=='settings'" @close="activeWindow=''" @btnClick="settingsClick"/>
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
    <out-value caption="Tool" :val="activeTool"/>
    <out-value caption="Window" :val="activeWindow"/>
    <out-value caption="Overlay-Mode" :val="global.mode"/>
    <out-value caption="Input-Mode" :val="global.inputMode"/>
    <out-value caption="Zoom" :val="zoom"/>
    <out-value caption="Suspended" :val="suspend.toString()"/>
    <out-coord v-if="pos" caption="Pos" :x="pos.x" :y="pos.y" :decimal="0"/>
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
  width: 260px;
  color: white;
  padding: 5px;
  margin: 15px;
  background-color: navy;
  opacity: 0.8;
  border-radius: 4px;
}

</style>
