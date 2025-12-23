<script setup lang="ts">

import PanZoomMap from "@/components/pan-zoom-map.vue";

const panHalt = () => {
  console.log('Pan halted');
};

</script>

<template>
  <pan-zoom-map src="https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg" @pan-halt="panHalt"/>
  <div id="overlay">Sticky Toolbox</div>
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
