<script setup lang="ts">

import {computed, onBeforeMount, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {cdnUrl, findMap} from "@/data/map.ts";
import type {Station} from "@/model/station.ts";
import DetailsPopup from "@/components/details-popup.vue";
import MapToolbar from "@/components/map-toolbar.vue";
import SettingsWindow from "@/components/settings-window.vue";
import SymbolsWindow from "@/components/symbols-window.vue";
import RouteWindow from "@/components/route-window.vue";
import WhiteboardWindow from "@/components/whiteboard-window.vue";
import {type OverlayContext, OverlayManager} from "@/scripts/overlay.ts";
import {ZoomPanOverlay} from "@/scripts/overlays/zoomPanOverlay.ts";
import {LocateOverlay} from "@/scripts/overlays/locateOverlay.ts";
import {BullseyeOverlay} from "@/scripts/overlays/bullseyeOverlay.ts";
import {MeassureOverlay} from "@/scripts/overlays/meassureOverlay.ts";
import {DropFileHandler} from "@/scripts/dropFileHandler.ts";
import {MissionManager} from "@/scripts/missionManager.ts";
import {RouteOverlay} from "@/scripts/overlays/routeOverlay.ts";
import {StationOverlay} from "@/scripts/overlays/stationOverlay.ts";
import {SymbolOverlay} from "@/scripts/overlays/symbolOverlay.ts";
import {useRoute} from "vue-router";
import {Mode} from "@/model/mode.ts";

const selectedStation = ref<Station | undefined>();
const dropdownName = ref("");

const mapRef = ref<HTMLImageElement | null>(null);
const annotationRef = ref<HTMLCanvasElement | null>(null);

let canvasContext: CanvasRenderingContext2D | null = null;

const global = useGlobalStore()
const settings = useSettingsStore()

const ovlMgr = new OverlayManager()

const dropFileHandler = new DropFileHandler()
const missionMgr = new MissionManager()

const route = useRoute()

onBeforeMount(() => {
  const name = route.params['name']
  const mapName = Array.isArray(name) ? name[0] : name
  if (mapName) {
    global.map = findMap(mapName)
  }
})

onMounted(() => {
  console.log("mounting map")
  global.mode = Mode.Move
  const cnv = initializeCanvas();

  const ctx: OverlayContext = {
    map: mapRef.value!,
    ...cnv,
    redraw: ovlMgr.redraw,
    mouseDown: 0
  }
  ovlMgr.init(ctx)

  const zoomPanOvl = new ZoomPanOverlay(ctx)

  dropFileHandler.onIniLoaded((filename: string, content: string) => {
    missionMgr.loadDataCardridge(filename, content)
  })

  const stationOverlay = new StationOverlay(ctx)
  stationOverlay.onSelectStation(station => showPopup(station))

  ovlMgr.registerOverlay(new BullseyeOverlay(ctx))
  ovlMgr.registerOverlay(new SymbolOverlay(ctx))
  ovlMgr.registerOverlay(zoomPanOvl)
  ovlMgr.registerOverlay(stationOverlay)
  ovlMgr.registerOverlay(new LocateOverlay(ctx))
  ovlMgr.registerOverlay(new RouteOverlay(ctx, missionMgr))
  ovlMgr.registerOverlay(new MeassureOverlay(ctx))
  ovlMgr.activatePointerEvents()
  zoomPanOvl.scaleView()
})

onBeforeUnmount(() => {
  ovlMgr.deactivatePointerEvents()
})

function initializeCanvas(): { canvas: HTMLCanvasElement, context: CanvasRenderingContext2D } {
  console.log("initializing canvas")
  if (!annotationRef.value) throw new Error("canvas element not found");
  canvasContext = annotationRef.value.getContext("2d", {willReadFrequently: true});
  if (!canvasContext) throw new Error("failed to get the 2D context");
  canvasContext.globalAlpha = 1;
  return {canvas: annotationRef.value!, context: canvasContext}
}

watch(dropdownName, (newValue) => {
  const ovl = ovlMgr.getOverlay(LocateOverlay)!
  if (newValue == "") {
    ovl.clearLocation()
  } else {
    console.log(`locating airbase '${newValue}'`)
    ovl.locateAirbase(newValue)
  }
})

const debugMessage = computed(() => {
    return `Mode: ${global.mode}, Zoom: ${global.zoom.factor.toFixed(2)}`
  }
)

function showPopup(station: Station) {
  selectedStation.value = station;
}

const execTool = (tool: string) => {
  const ovl = ovlMgr.getOverlay(ZoomPanOverlay)!
  console.log(`activated tool '${tool}'`);
  switch (tool) {
    case "move":
      break;
    case "zoom1":
      ovl.zoom(1)
      ovl.scaleView()
      break;
    case "zoom2":
      ovl.zoom(-1)
      ovl.scaleView()
      break;
    case "settings":
    case "route":
    case "symbol":
    case "whiteboard":
      activeWindow.value = tool
      break;
  }
}

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

const activeWindow = ref('')

</script>

<template>
  <details-popup :station="selectedStation" :visible="selectedStation!=undefined" @close="selectedStation=undefined"/>
  <settings-window :visible="activeWindow=='settings'" @close="activeWindow=''"/>
  <symbols-window :visible="activeWindow=='symbol'" @close="activeWindow=''"/>
  <route-window :visible="activeWindow=='route'" :missionManager="missionMgr" @close="activeWindow=''"/>
  <whiteboard-window :visible="activeWindow=='whiteboard'" @close="activeWindow=''"/>

  <div ref="containerRef" id="container" v-if="global.map">
    <img ref="mapRef" id="map" :width="global.map.pixels" :height="global.map.pixels"
         :src="`${cdnUrl}/${global.map.folder}/maps/${global.map.mapFilename}`" alt="">
    <div id="div_layers" @drop="dropFileHandler.process" @dragover="dropFileHandler.allow">
      <canvas ref="annotationRef" id="annotation" :width="global.map.pixels" :height="global.map.pixels"></canvas>
      <div id="inputs">
        <div id="locate">
          <select id="selectAirbase" v-model="dropdownName" class="suspend-prevent">
            <option value=""></option>
            <optgroup v-for="(v,k) in getStationsByCountryType()" v-bind:key="k" :label="k">
              <option v-for="c in v" v-bind:key="c.name" :value="c.name">{{ c.name }}</option>
            </optgroup>
          </select>
          <button @click="dropdownName = ''" class="suspend-prevent" style="pointer-events: auto;">Clear</button>
        </div>
        <map-toolbar @toolClick="execTool" class="tspc" v-model="global.mode"/>
      </div>
      <div id="cursor-val" class="message" v-if="settings.viz.xy">{{ global.message }}</div>
      <div id="debug" class="message">{{ debugMessage }}</div>
      <div id="dbgtg" class="message" v-if="global.pointerTargets.length > 0">
        <ul>
          <li v-for="(t,i) in global.pointerTargets" v-bind:key="i">{{ t.type }} {{ t.name }}</li>
        </ul>
      </div>
    </div>
    <div id="skyvector" @pointerdown.stop @mousedown.stop @click.stop>
      <a href="https://skyvector.com" target="_blank">
        <img src="../../public/resources/skyvector.png" alt="SkyVector">
      </a>
    </div>
  </div>
</template>

<style scoped>
.tspc {
  margin-top: 10px !important;
}

#locate {
  display: flex;
  flex-direction: row;
  align-items: center;
}

#selectAirbase {
  pointer-events: auto;
  font-size: medium;
  width: 280px;
}

#container {
  position: relative;
}

#map {
  position: absolute;
  filter: grayscale(0);
}

#annotation {
  position: absolute;
}

#inputs {
  pointer-events: none;
  position: fixed;
  left: 15px;
  top: 45px;
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
