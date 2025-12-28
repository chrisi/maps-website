<script setup lang="ts">
import ImgMap from "@/components/img-map.vue";
import {ref} from "vue";

const xPos = ref(0)
const yPos = ref(0)
const zoom = ref(1)

function onPanStop({x, y, scale}: { x: number, y: number, scale: number }) {
  console.log(`Pan stopped at x: ${x}, y: ${y}, scale: ${scale}`);
  drawCanvas()
}

function onChange({x, y, scale}: { x: number, y: number, scale: number }) {
  xPos.value = x
  yPos.value = y
  zoom.value = scale
}

const mapRef = ref<InstanceType<typeof ImgMap> | null>(null);

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

function zoomToJapan() {
  mapRef.value?.setZoom(2, 5500, 5400);
}

function resetZoom() {
  mapRef.value?.resetZoom();
}

function drawCanvas() {
  const ctx = mapRef.value?.getContext();
  if (!ctx || !mapRef.value) return;

  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;

  console.log('Drawing canvas with size', w, 'x', h);

  // Clear previous drawings if needed, though usually we might want to keep them
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = w / 100; // Relative line width

  // Draw a cross across the entire image
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, h);
  ctx.stroke();

  ctx.strokeStyle = 'magenta';
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(0, h);
  ctx.stroke();

  // Draw a border
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = w / 200;
  ctx.strokeRect(0, 0, w, h);
}

</script>

<template>
  <img-map ref="mapRef" src="https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg"
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
  <button @click="drawCanvas">Draw Rect</button>
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
