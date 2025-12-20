<script setup lang="ts">

import MobilePanZoomTest from "@/components/mobile-pan-zoom-test.vue";

const panHalt = () => {
  console.log('Pan halted');
};

</script>

<template>
  <mobile-pan-zoom-test src="https://cdn.falcon-bms.com/maps/04_KTO/maps/KTO_UI_Map_6k.jpeg" @pan-halt="panHalt" />
</template>

<style scoped>

</style>
