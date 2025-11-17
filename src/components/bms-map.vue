<script setup lang="ts">

import {computed, onBeforeUnmount, onMounted, reactive, ref} from "vue";
import {dropHandler, allowDrop} from "@/common/scripts/map_files";
import {drawHighlight} from "@/common/scripts/map_draw";
import {stationsByCountryType, stations} from "@/data/stations.ts";
import type {Station} from "@/model/Station.ts";
import DetailsPopup from "@/components/details-popup.vue";
import MapToolbar from "@/components/map-toolbar.vue";
import AirbaseAreas from "@/components/airbase-areas.vue";
import SettingsWindow from "@/components/settings-window.vue";
import SymbolsWindow from "@/components/symbols-window.vue";
import RouteWindow from "@/components/route-window.vue";
import WhiteboardWindow from "@/components/whiteboard-window.vue";
import {Mode} from "@/model/Mode.ts";

const mapUrl = "https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg"

const selectedStation = ref<Station | undefined>();

const containerRef = ref<HTMLDivElement | null>(null);
const mapRef = ref<HTMLImageElement | null>(null);
const airbasesRef = ref<HTMLImageElement | null>(null);
const airbaseMapRef = ref<HTMLMapElement | null>(null);
const annotationRef = ref<HTMLCanvasElement | null>(null);

let canvasContext: CanvasRenderingContext2D | null = null;

const limits = {
  zoom_max: 2.5,
  zoom_min: 0.5,
  wheel_rate_hz: 20
}

const properties = reactive<Properties>({
  zoom: 1,
  mode: Mode.None,
  mouseDown: false
});

interface Properties {
  zoom: number
  mode: Mode
  mouseDown: boolean
}

onMounted(() => {
  initializeCanvas()
  properties.zoom = 1
  properties.mode = Mode.Move
  scaleView(undefined)

  const pane = airbasesRef.value!
  pane.addEventListener('mousedown', pointer_start);
  pane.addEventListener('mousemove', pointer_drag);
  pane.addEventListener('mouseup', pointer_end);
  pane.addEventListener("wheel", mouse_zoom, {passive: false});
})

onBeforeUnmount(() => {
  const pane = airbasesRef.value!
  pane.removeEventListener('mousedown', pointer_start);
  pane.removeEventListener('mousemove', pointer_drag);
  pane.removeEventListener('mouseup', pointer_end);
  pane.removeEventListener("wheel", mouse_zoom);
})

let pointerPanStart = {x: 0, y: 0};

function pointer_start(e: MouseEvent) {
  e.preventDefault()
  switch (properties.mode) {
    case Mode.Move:
      if (properties.mouseDown) break;
      const ofs = document.scrollingElement!;
      pointerPanStart = {x: e.clientX + ofs.scrollLeft, y: e.clientY + ofs.scrollTop};
      properties.mouseDown = true;
      break;
  }
}

function pointer_drag(e: MouseEvent) {
  e.preventDefault()
  switch (properties.mode) {
    case Mode.Move:
      if (!properties.mouseDown) break;
      const dx = pointerPanStart.x - e.clientX;
      const dy = pointerPanStart.y - e.clientY;
      window.scrollTo(dx, dy);
      break;
  }
}

function pointer_end(e: MouseEvent) {
  e.preventDefault()
  switch (properties.mode) {
    case Mode.Move:
      if (!properties.mouseDown) break;
      pointerPanStart = {x: 0, y: 0};
      properties.mouseDown = false;
      break;
  }
}

let wheel_enabled = true;

// Allow zooming with the mouse but limit it to a set wheel rate
// See Limiters (20 hz) and set discrete steps
const mouse_zoom = function (e: WheelEvent) {
  e.preventDefault();

  // Normalize deltaY to a consistent step (e.g., 0.1 zoom per scroll)
  const zoomStep = Math.sign(e.deltaY) * 0.1; // Adjust step size as needed
  const newZoom = properties.zoom - zoomStep;

  // Ensure zoom stays within limits and apply rounding to avoid floating-point drift
  if (wheel_enabled && newZoom >= limits.zoom_min && newZoom <= limits.zoom_max) {
    properties.zoom = Math.round(newZoom * 100) / 100; // Round to 2 decimal places
    scaleView(undefined);
    // saveSettings();
    // refreshCanvas();
    wheel_enabled = false;
    setTimeout(function () {
      wheel_enabled = true;
    }, (1 / limits.wheel_rate_hz) * 1000);
  }
};

function initializeCanvas() {
  canvasContext = annotationRef.value!.getContext("2d", {willReadFrequently: true});
  canvasContext!.globalAlpha = 1;
}

const message = computed(() => {
    return `Zoom: ${properties.zoom.toFixed(2)}`
  }
)

const debugMessage = computed(() => {
    return `Mode: ${properties.mode}, MouseDown: ${properties.mouseDown}`
  }
)

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

  <div ref="containerRef" id="container">
    <img ref="mapRef" id="map" width="3840" height="3840" :src="mapUrl" alt="">
    <div id="div_layers" @drop="dropHandler" @dragover="allowDrop">
      <canvas ref="annotationRef" id="annotation" width="3840" height="3840"></canvas>
      <map ref="airbaseMapRef" id="airbase_map" data-map-datum="38.5,127.18" data-map-version="2" name="airbase_map">
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
        <map-toolbar @toolClick="execTool" class="tspc" v-model="properties.mode"/>
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
