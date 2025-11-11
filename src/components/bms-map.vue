<script setup lang="ts">

import {dropHandler, allowDrop} from "@/common/scripts/map_files.js";
import {onMounted, ref} from "vue";
import DetailsPopup from "@/components/details-popup.vue";
import {stations} from "@/data/stations.ts";
import type {Station} from "@/model/Station.ts";

interface Tool {
  name: string
  caption: string
  icon: string
}

const tools: Tool[] = [
  {name: "move", caption: "move", icon: "icon_move1.png"},
  {name: "zoom1", caption: "Zoom-Out", icon: "icon_zoom1.png"},
  {name: "zoom2", caption: "Zoom-In", icon: "icon_zoom2.png"},
  {name: "bullseye", caption: "Bullseye", icon: "icon_bullseye.png"},
  {name: "compass", caption: "Compass", icon: "icon_compass.png"},
  {name: "ruler", caption: "Ruler", icon: "icon_ruler.png"},
  {name: "symbol", caption: "Symbol", icon: "icon_sword.png"},
  {name: "pencil", caption: "Pencil", icon: "icon_pencil.png"},
  {name: "text", caption: "Text", icon: "icon_text.png"},
  {name: "eraser", caption: "Eraser", icon: "icon_eraser.png"},
  {name: "settings", caption: "Settings", icon: "icon_menu.png"},
]

const coordsByCountryType = stations.reduce((obj, coord) => {
  const key = `${coord.country} - ${coord.type}s`;
  if (!obj[key]) {
    obj[key] = [];
  }
  obj[key].push(coord);
  return obj;
}, {} as Record<string, Station[]>);

const map = "https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg"

const showModal = ref(false);
const selectedStation = ref<Station | undefined>();

interface Properties {
  zoom: number
}

const properties: Properties = {
  zoom: 1
}

onMounted(() => {
  properties.zoom = 0.25;
  storeMapCoordinates();
  scaleMap(3840 / 4096);
  scaleView(undefined);
})

let hotspots = [] as HTMLAreaElement[];

function storeMapCoordinates() {
  const imgMap = document.getElementById("imgMap")!;
  hotspots = [];
  for (const area of imgMap.children) hotspots.push(area as HTMLAreaElement);
}

function scaleMap(scale: number) {
  const imageMap = document.getElementById("imgMap")!;
  const areas = imageMap.children as unknown as HTMLAreaElement[];
  let i = 0;
  for (const area of areas) {
    const coordArr = hotspots[i++]!.coords.split(',');
    area.coords = coordArr.map(coord => Math.round(+coord * scale)).join(',');
    // if (area.alt == "Legend") properties.legend = area.coords;
    // if (area.alt == "Bullseye") bullseye.coords = area.coords;
  }
}

let last_zoom = 1;

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

  // Setup the main canvas for the view
  const canvas = document.getElementById("annotation")! as HTMLCanvasElement;
  console.log(canvas);
  const context = canvas.getContext("2d", {willReadFrequently: true})!;
  context.globalAlpha = 1;

  // Update map dimensions
  const base_map = document.getElementById('map')!;
  base_map.style.width = dim_str;
  base_map.style.height = dim_str;

  const ovly_map = document.getElementById('airbases')!;
  ovly_map.style.width = dim_str;
  ovly_map.style.height = dim_str;
  canvas.width = dimension;
  canvas.height = dimension;

  // Scale bullseye coordinates
// bullseye.x *= scale;
// bullseye.y *= scale;

  // Scale the airport coordinates on the image map
  scaleMap(scale);

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
  showModal.value = true;
}

function locateAirbase(ap: string): void {
  const sta = stations.find(c => c.name === ap);
  selectedStation.value = sta
  if (sta) {
    const imageMap = document.getElementById("imgMap")!;
    const areas = [...imageMap.children] as HTMLAreaElement[];
    const area = areas.find(a => a.title === ap);
    if (area) {
      //TODO: paint circle on map
      const coordArr = area.coords.split(',');
      console.log(coordArr);
      // const x = +coordArr[0];
      // const y = +coordArr[1];
    }
  }
}

</script>

<template>

  <details-popup :station="selectedStation" :visible="selectedStation!=null"/>

  <div id="container">
    <img id="map" width="3840" height="3840" :src="map" alt="">
    <div id="div_layers" @drop="dropHandler" @dragover="allowDrop">
      <canvas id="annotation" width="3840" height="3840"></canvas>
      <img id="airbases" width="3840" height="3840" src="/resources/map_airbases.png" alt=""
           usemap="#imgMap">
      <div id="inputs">
        <table id="locate" class="pm0">
          <tbody>
          <tr>
            <td><label id="cursor-val">What goes here?</label></td>
          </tr>
          <tr>
            <td>
              <select id="selectAirbase" @change="selectAirbase($event)" size="1">
                <optgroup v-for="(v,k) in coordsByCountryType" v-bind:key="k" :label="k">
                  <option v-for="c in v" v-bind:key="c.name" :value="c.name">{{ c.name }}</option>
                </optgroup>
              </select>
            </td>
          </tr>
          </tbody>
        </table>
        <table id="toolbar" class="pm0 tspc">
          <tbody>
          <tr>
            <td>
              <img src="/common/assets/icon_toolbar.png" class="toolBar" alt="">
            </td>
          </tr>
          <tr v-for="tool in tools" v-bind:key="tool.name">
            <td>
              <img :src="'/common/assets/'+tool.icon"
                   :alt="tool.caption" :id="tool.name"
                   class="toolButton" onclick="button(event)">
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <map name="Map" id="imgMap" data-map-datum="38.5,127.18" data-map-version="2">
    <area
      v-for="sta in stations"
      :key="`${sta.country}-${sta.name}`"
      shape="circle"
      :coords="`${sta.posx},${sta.posy},${sta.size}`"
      href="javascript:void(0);"
      :alt="sta.country"
      :title="sta.name"
      @click="locateAirbase(sta.name)"
    >

    <!-- Special Map areas and Coordinates based on 4096x4096-->
    <!-- Map Legend Area -->
    <area shape="rect" coords="0,1920,0,1920" alt="Legend">
    <!-- Set Default Bullseye coordinates -->
    <area shape="circle" coords="732,1049,1" alt="Bullseye">
  </map>
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

.toolBar {
  width: 32px;
  height: 8px;
  display: block;
}

.toolButton {
  width: 32px;
  height: 32px;
  display: block;
  cursor: pointer;
}

#selectAirbase {
  font-size: medium;
  width: 280px;
}

#cursor-val {
  color: white;
  font-size: small;
  font-family: monospace;
  font-weight: bold;
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
  position: fixed;
  left: 15px;
  top: 15px;
}
</style>
