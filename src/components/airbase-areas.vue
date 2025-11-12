<script setup lang="ts">
import {computed} from "vue";
import type {Station} from "@/model/Station.ts";

const dataScale = 0.5 // TODO: centralize

const props = defineProps({
  stations: {
    type: Array as () => Station[],
    required: true
  },
  zoom: {
    type: Number,
    required: true
  }
})

// Computed scaled stations
const scaledStations = computed(() => {
  return props.stations.map(sta => ({
    ...sta,
    posx: Math.round(sta.posx / dataScale * props.zoom),
    posy: Math.round(sta.posy / dataScale * props.zoom),
    size: Math.round(sta.size / dataScale * props.zoom)
  }))
})

const emit = defineEmits(['mapClick'])

</script>

<template>
  <area
    v-for="sta in scaledStations"
    :key="sta.name"
    shape="circle"
    href="javascript:void(0);"
    :coords="`${sta.posx},${sta.posy},${sta.size}`"
    :alt="sta.country"
    :title="sta.name"
    @click="emit('mapClick', sta)"
  >
</template>
