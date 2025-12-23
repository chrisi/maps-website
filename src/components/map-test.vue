<script setup lang="ts">
import PanZoomMap from "@/components/pan-zoom-map.vue";
import {ref} from "vue";

const xPos = ref(0)
const yPos = ref(0)
const zoom = ref(1)

function onPanStop({x, y, scale}: { x: number, y: number, scale: number }) {
  console.log(`Pan stopped at x: ${x}, y: ${y}, scale: ${scale}`);
}

function onChange({x, y, scale}: { x: number, y: number, scale: number }) {
  xPos.value = x
  yPos.value = y
  zoom.value = scale
}

const mapRef = ref<InstanceType<typeof PanZoomMap> | null>(null);

function zoomIn() {
  if (mapRef.value) {
    // Zoom in by 1.5x of current scale
    mapRef.value.setZoom(mapRef.value.scale * 1.5);
  }
}

function zoomOut() {
  if (mapRef.value) {
    mapRef.value.setZoom(mapRef.value.scale / 1.5);
  }
}

function resetZoom() {
  mapRef.value?.setZoom(1);
}

function zoomToJapan() {
  mapRef.value?.setZoom(12, 5500, 5400);
}

</script>

<template>
  <pan-zoom-map ref="mapRef" src="https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg"
                @pan-stopped="onPanStop" @change="onChange"/>
  <div id="overlay">
    <h4>Sticky Toolbox</h4>
    <div>Pos: {{ xPos }}/{{ yPos }}</div>
    <div>Zoom: {{ zoom }}</div>
  </div>
  <button @click="resetZoom">Reset Zoom</button>
  <button @click="zoomIn">Zoom In</button>
  <button @click="zoomOut">Zoom Out</button>
  <button @click="zoomToJapan">Zoom To Japan</button>
</template>

<style scoped>
#overlay {
  position: fixed;
  top: 20px;
  left: 20px;
  height: 400px;
  width: 250px;
  color: white;
  padding: 10px;
  background-color: navy;
  opacity: 0.5;
}
</style>
