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
  const countryOrder = ["South Korea", "Japan", "North Korea", "China",
    "Italy", "Croatia", "Greece",
    "Serbia and Montenegro", "Bosnia and Herzegovina",
    "Slovenia", "Hungary", "North Macedonia", "Albania", "Kosovo"];
  const typeOrder = ["Airbases", "Airstrips", "Nav-Beacons"];

  const grouped = props.stations.reduce((obj, sta) => {

    let typeLabel: string
    switch (sta.type) {
      case 'Airbase':
        typeLabel = 'Airbases';
        break;
      case 'Airstrip':
        typeLabel = 'Airstrips';
        break;
      default:
        typeLabel = 'Nav-Beacons';
        break;
    }

    const key = `${sta.country} - ${typeLabel}`;
    if (!obj[key]) {
      obj[key] = [];
    }
    obj[key].push(sta);
    return obj;
  }, {} as Record<string, Station[]>);

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [countryA, typeA] = a.split(' - ');
    const [countryB, typeB] = b.split(' - ');

    const countryIndexA = countryOrder.indexOf(countryA!);
    const countryIndexB = countryOrder.indexOf(countryB!);

    if (countryIndexA !== countryIndexB) {
      return (countryIndexA === -1 ? 99 : countryIndexA) - (countryIndexB === -1 ? 99 : countryIndexB);
    }

    const typeIndexA = typeOrder.indexOf(typeA!);
    const typeIndexB = typeOrder.indexOf(typeB!);

    return (typeIndexA === -1 ? 99 : typeIndexA) - (typeIndexB === -1 ? 99 : typeIndexB);
  });

  return sortedKeys.map(key => ({
    label: key,
    stations: grouped[key]!.sort((a, b) => a.name.localeCompare(b.name))
  }));
}

const dropdownRef = ref<HTMLSelectElement | null>(null)

function focus() {
  dropdownRef.value?.focus()
}

defineExpose({focus})

</script>

<template>
  <select ref="dropdownRef" v-model="dropdownName" @change="updateSelection">
    <option value=""></option>
    <optgroup v-for="group in getStationsByCountryType()" v-bind:key="group.label" :label="group.label">
      <option v-for="c in group.stations" v-bind:key="c.name" :value="c.name">{{ c.name }}</option>
    </optgroup>
  </select>
</template>

<style scoped>
select {
  pointer-events: auto;
}
</style>
