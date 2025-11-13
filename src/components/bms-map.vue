<script setup lang="ts">

import {onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {dropHandler, allowDrop} from "@/common/scripts/map_files";
import {drawHighlight} from "@/common/scripts/map_draw";
import DetailsPopup from "@/components/details-popup.vue";
import AirbaseAreas from "@/components/airbase-areas.vue";
import MapToolbar from "@/components/map-toolbar.vue";
import type {Station} from "@/model/Station.ts";
import {stationsByCountryType, stations} from "@/data/stations.ts";

const mapUrl = "https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg"

const selectedStation = ref<Station | undefined>();

const message = ref("");

const containerRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<HTMLImageElement | null>(null);
const airbasesRef = ref<HTMLImageElement | null>(null);
const annotationRef = ref<HTMLCanvasElement | null>(null);

let canvasContext: CanvasRenderingContext2D | null = null;

enum Mode {
  None = "none",
  Move = "move",
  Bullseye = "bullseye",
  Compass = "compass",
  Measure = "measure",
  Draw = "draw",
  Erase = "erase",
  Write = "write",
  Symbol = "symbol"
}

const properties = reactive<Properties>({
  zoom: 1,
  mode: Mode.Move
});

interface Properties {
  zoom: number
  mode: Mode
}

onMounted(() => {
  initializeCanvas()
  properties.zoom = 1
  scaleView(undefined)
  message.value = "Zoom Level: " + properties.zoom.toFixed(2);
  airbasesRef.value!.addEventListener('mousedown', pointer_start);
  airbasesRef.value!.addEventListener('mousemove', pointer_drag);
  airbasesRef.value!.addEventListener('mouseup', pointer_end);
  // window.addEventListener("wheel", mouse_zoom, {passive: false});
})

onBeforeUnmount(() => {
  airbasesRef.value!.removeEventListener('mousedown', pointer_start);
  airbasesRef.value!.removeEventListener('mousemove', pointer_drag);
  airbasesRef.value!.removeEventListener('mouseup', pointer_end);
})

let pointerPanStart = {x: 0, y: 0};
let panOffset = {x: 0, y: 0};

function pointer_start(e: MouseEvent) {
  e.preventDefault()
  const scroll_element = document.scrollingElement!;
  pointerPanStart = {x: e.clientX, y: e.clientY};
  panOffset = {x: scroll_element.scrollLeft, y: scroll_element.scrollTop};
  properties.mode = Mode.Move;
}

function pointer_end(e: MouseEvent) {
  e.preventDefault()
  pointerPanStart = {x: 0, y: 0};
  properties.mode = Mode.None;
}

function pointer_drag(e: MouseEvent) {
  e.preventDefault()
  switch (properties.mode) {
    case Mode.Move:
      const dx = pointerPanStart.x - e.clientX;
      const dy = pointerPanStart.y - e.clientY;
      window.scrollTo(panOffset.x + dx, panOffset.y + dy);
      break;
  }
}

function initializeCanvas() {
  canvasContext = annotationRef.value!.getContext("2d", {willReadFrequently: true});
  canvasContext!.globalAlpha = 1;
}

watch(
  () => properties.zoom,
  (newZoom) => {
    message.value = "Zoom Level: " + newZoom.toFixed(2);
  }
);

let last_zoom = 1

function scaleView(event: MouseEvent | undefined) { // Add event parameter to capture mouse position

  const dimension = 3840 * properties.zoom;
  const dim_str = dimension.toString() + "px";
  const scale = properties.zoom / last_zoom;

  const scroll_element = document.scrollingElement!;
  const client_width = scroll_element.clientWidth;
  const client_height = scroll_element.clientHeight;

  // Get mouse position relative to the viewport
  const mouseX = event ? event.clientX : client_width / 2; // Fallback to center if no event
  const mouseY = event ? event.clientY : client_height / 2;

  // Calculate mouse position relative to the document before scaling
  const doc_mouseX = scroll_element.scrollLeft + mouseX;
  const doc_mouseY = scroll_element.scrollTop + mouseY;

  airbasesRef.value!.style.width = dim_str;
  airbasesRef.value!.style.height = dim_str;

  mapRef.value!.style.width = dim_str;
  mapRef.value!.style.height = dim_str;

  annotationRef.value!.width = dimension;
  annotationRef.value!.height = dimension;

  // Scale bullseye coordinates
// bullseye.x *= scale;
// bullseye.y *= scale;

  // Calculate new scroll position to keep mouse point fixed
  const new_doc_mouseX = doc_mouseX * scale;
  const new_doc_mouseY = doc_mouseY * scale;
  scroll_element.scrollLeft = new_doc_mouseX - mouseX;
  scroll_element.scrollTop = new_doc_mouseY - mouseY;

  last_zoom = properties.zoom;
}

function selectAirbase(event: Event): void {
  const select = event.target as HTMLSelectElement;
  locateAirbase(select.value);
}

function locateAirbase(ap: string): void {
  const imageMap = document.getElementById("airbase_map")!;
  const areas = [...imageMap.children] as HTMLAreaElement[];
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
      document.getElementById("cursor-val")!.innerText = "Drag the map to move it around.";
      break;
    case "zoom1":
      properties.zoom /= 1.1;
      scaleView(undefined)
      break;
    case "zoom2":
      properties.zoom *= 1.1;
      scaleView(undefined)
      break;
  }
}

</script>

<template>
  <details-popup :station="selectedStation" :visible="selectedStation!=undefined" @close="selectedStation=undefined"/>

  <div ref="containerRef" id="container">
    <img ref="mapRef" id="map" width="3840" height="3840" :src="mapUrl" alt="">
    <div id="div_layers" @drop="dropHandler" @dragover="allowDrop">
      <canvas ref="annotationRef" id="annotation" width="3840" height="3840"></canvas>
      <map id="airbase_map" data-map-datum="38.5,127.18" data-map-version="2" name="airbase_map">
        <airbase-areas :zoom="properties.zoom" :stations="stations" @mapClick="showPopup"/>
        <!-- Special Map areas and Coordinates based on 4096x4096-->
        <!-- Map Legend Area -->
        <area shape="rect" coords="0,1920,0,1920" alt="Legend">
        <!-- Set Default Bullseye coordinates -->
        <area shape="circle" coords="732,1049,1" alt="Bullseye">
      </map>
      <img ref="airbasesRef" id="airbases" width="3840" height="3840" src="/resources/map_airbases.png" alt="" usemap="#airbase_map">
      <div id="inputs">
        <table id="locate" class="pm0">
          <tbody>
          <tr>
            <td><label id="cursor-val">{{ message }}</label></td>
          </tr>
          <tr>
            <td>
              <select id="selectAirbase" @change="selectAirbase($event)" size="1" style="display: block; margin: 0 auto;">
                <optgroup v-for="(v,k) in stationsByCountryType" v-bind:key="k" :label="k">
                  <option v-for="c in v" v-bind:key="c.name" :value="c.name">{{ c.name }}</option>
                </optgroup>
              </select>
            </td>
          </tr>
          </tbody>
        </table>
        <map-toolbar @toolClick="execTool" class="tspc"/>
      </div>
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
</style>
