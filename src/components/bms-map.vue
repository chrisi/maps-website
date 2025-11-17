<script setup lang="ts">

import {computed, onBeforeMount, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {dropHandler, allowDrop} from "@/common/scripts/map_files";
import {activatePointerEvents, deactivatePointerEvents, scaleView} from "@/scripts/pointer.ts";
import {drawHighlight} from "@/common/scripts/map_draw";
import {useStateStore} from "@/stores/state.ts";
import {properties} from "@/scripts/properties.ts";
import {maps} from "@/data/map.ts";
import {stationsByCountryType, stations} from "@/data/stations.ts";
import type {Station} from "@/model/station.ts";
import DetailsPopup from "@/components/details-popup.vue";
import MapToolbar from "@/components/map-toolbar.vue";
import AirbaseAreas from "@/components/airbase-areas.vue";
import SettingsWindow from "@/components/settings-window.vue";
import SymbolsWindow from "@/components/symbols-window.vue";
import RouteWindow from "@/components/route-window.vue";
import WhiteboardWindow from "@/components/whiteboard-window.vue";

const selectedStation = ref<Station | undefined>();

const containerRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<HTMLImageElement | null>(null);
const airbasesRef = ref<HTMLImageElement | null>(null);
const airbaseMapRef = ref<HTMLMapElement | null>(null);
const annotationRef = ref<HTMLCanvasElement | null>(null);

let canvasContext: CanvasRenderingContext2D | null = null;

const state = useStateStore()

onBeforeMount(() => {
  state.map = maps[0];
})

onMounted(() => {
  state.mapRef = mapRef.value!
  state.airbasesRef = airbasesRef.value!
  state.annotationRef = annotationRef.value!
  initializeCanvas()
  scaleView(undefined)
  activatePointerEvents()
})

onBeforeUnmount(() => {
  deactivatePointerEvents()
})

function initializeCanvas() {
  if (!annotationRef.value) return;
  canvasContext = annotationRef.value.getContext("2d", {willReadFrequently: true});
  if (!canvasContext) return;
  canvasContext.globalAlpha = 1;
  state.cnvCtx = canvasContext
}

const message = computed(() => {
    return `Zoom: ${properties.zoom.toFixed(2)}`
  }
)

const debugMessage = computed(() => {
    return `Mode: ${state.mode}, MouseDown: ${properties.mouseDown}`
  }
)

function selectAirbase(event: Event): void {
  const select = event.target as HTMLSelectElement;
  locateAirbase(select.value);
}

function locateAirbase(ap: string): void {
  const areas = [...airbaseMapRef.value!.children] as HTMLAreaElement[];
  const area = areas.find(a => a.title === ap);
  if (area) {
    const coordArr = area.coords.split(',');
    const x = +coordArr[0]!;
    const y = +coordArr[1]!;
    drawHighlight(canvasContext!, x, y, 17 * properties.zoom);
    // Make the airbase the focus
    window.scrollTo(x - window.innerWidth / 2, y - window.innerHeight / 2);
  }
}

function showPopup(station: Station) {
  selectedStation.value = station;
}

const execTool = (tool: string) => {
  console.log(tool);
  switch (tool) {
    case "move":
      break;
    case "zoom1":
      properties.zoom /= 1.1;
      scaleView(undefined)
      break;
    case "zoom2":
      properties.zoom *= 1.1;
      scaleView(undefined)
      break;
    case "settings":
    case "route":
    case "symbol":
    case "whiteboard":
      activeWindow.value = tool
      break;
  }
}

const activeWindow = ref('')

</script>

<template>
  <details-popup :station="selectedStation" :visible="selectedStation!=undefined" @close="selectedStation=undefined"/>
  <settings-window :visible="activeWindow=='settings'" @close="activeWindow=''"/>
  <symbols-window :visible="activeWindow=='symbol'" @close="activeWindow=''"/>
  <route-window :visible="activeWindow=='route'" @close="activeWindow=''"/>
  <whiteboard-window :visible="activeWindow=='whiteboard'" @close="activeWindow=''"/>

  <div ref="containerRef" id="container" v-if="state.map">
    <img ref="mapRef" id="map" :width="state.map.pixels" :height="state.map.pixels" :src="state.map.mapUrl" alt="">
    <div id="div_layers" @drop="dropHandler" @dragover="allowDrop">
      <canvas ref="annotationRef" id="annotation" :width="state.map.pixels" :height="state.map.pixels"></canvas>
      <map ref="airbaseMapRef" id="airbase_map" name="airbase_map">
        <airbase-areas :zoom="properties.zoom" :stations="stations" @mapClick="showPopup"/>
        <!-- Special Map areas and Coordinates based on 4096x4096-->
        <!-- Map Legend Area -->
        <area shape="rect" coords="0,1920,0,1920" alt="Legend">
        <!-- Set Default Bullseye coordinates -->
        <area shape="circle" coords="732,1049,1" alt="Bullseye">
      </map>
      <img ref="airbasesRef" id="airbases" :width="state.map.pixels" :height="state.map.pixels" :src="state.map.airbasesUrl"
           alt="" usemap="#airbase_map">
      <div id="inputs">
        <table id="locate" class="pm0">
          <tbody>
          <tr>
            <td><label id="cursor-val">{{ message }}</label></td>
          </tr>
          <tr>
            <td>
              <select id="selectAirbase" @change="selectAirbase($event)" class="suspend-prevent">
                <optgroup v-for="(v,k) in stationsByCountryType" v-bind:key="k" :label="k">
                  <option v-for="c in v" v-bind:key="c.name" :value="c.name">{{ c.name }}</option>
                </optgroup>
              </select>
            </td>
          </tr>
          </tbody>
        </table>
        <map-toolbar @toolClick="execTool" class="tspc" v-model="state.mode"/>
      </div>
      <div id="debug">{{ debugMessage }}</div>
    </div>
  </div>
</template>

<style scoped>
.tspc {
  margin-top: 10px !important;
}

.pm0 {
  padding: 0;
  margin: 0;
  border-spacing: 0;
}

.pm0 td {
  padding: 0;
}

#selectAirbase {
  pointer-events: auto;
  font-size: medium;
  width: 280px;
}

#cursor-val {
  color: white;
  font-weight: bolder;
  font-family: monospace;
  display: inline-block;
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

#airbases {
  position: absolute;
}

#inputs {
  pointer-events: none;
  position: fixed;
  left: 15px;
  top: 15px;
}

#debug {
  position: fixed;
  bottom: 0;
  left: 0;
  margin: 15px;
  pointer-events: none;
  font-family: monospace;
  background-color: rgba(255, 255, 255, 0.5);
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
