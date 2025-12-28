<script setup lang="ts">

import {ref} from "vue";
import CanvasMap from "@/components/canvas-map.vue";

const xPos = ref(0)
const yPos = ref(0)
const zoom = ref(1)
</script>

<template>
  <canvas-map src="https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg"/>
  <div id="overlay">
    <h4>Sticky Toolbox</h4>
    <div>Pos: {{ xPos }}/{{ yPos }}</div>
    <div>Zoom: {{ zoom }}</div>
  </div>
</template>

<style scoped>
#overlay {
  position: fixed;
  top: 20px;
  left: 20px;
  height: 100px;
  width: 250px;
  color: white;
  padding: 10px;
  background-color: navy;
  opacity: 0.5;
}
</style>
