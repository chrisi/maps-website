<script setup lang="ts">
import type {Station} from "@/model/station.ts";
import {ref, watch} from "vue";

const props = defineProps<{
  stations: Station[]
}>()

const selectedStation = defineModel<Station | undefined>()

const dropdownName = ref('')

const updateSelection = () => {
  selectedStation.value = props.stations.find(s => s.name === dropdownName.value) || undefined
}

watch(selectedStation, (newStation) => {
  dropdownName.value = newStation?.name || ''
}, {immediate: true})

const getStationsByCountryType = () => {
  return props.stations.reduce((obj, sta) => {
    const key = `${sta.country} - ${sta.type}s`;
    if (!obj[key]) {
      obj[key] = [];
    }
    obj[key].push(sta);
    return obj;
  }, {} as Record<string, Station[]>);
}

const dropdownRef = ref<HTMLSelectElement | null>(null)

function focus() {
  dropdownRef.value?.focus()
}

defineExpose({ focus })

</script>

<template>
  <select ref="dropdownRef" v-model="dropdownName" @change="updateSelection">
    <option value=""></option>
    <optgroup v-for="(v,k) in getStationsByCountryType()" v-bind:key="k" :label="k">
      <option v-for="c in v" v-bind:key="c.name" :value="c.name">{{ c.name }}</option>
    </optgroup>
  </select>
</template>

<style scoped>
select {
  pointer-events: auto;
}
</style>
