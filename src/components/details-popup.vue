<script setup lang="ts">

import {nextTick, ref, watch} from "vue";
import type {Chart, Details, Station} from "@/model/station.ts";
import ToolWindow from "@/components/forms/tool-window.vue";
import ToolListitem from "@/components/forms/tool-listitem.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import {useGlobalStore} from "@/stores/global.ts";
import {cdnUrl, maps} from "@/data/map.ts";
import StationSelector from "@/components/station-selector.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import type {Coord, Point} from "@/model/base.ts";
import {strLatLong} from "@/scripts/conv.ts";
import {map2LatLong} from "@/scripts/math.ts";

const props = defineProps<{
  modelValue: Station | undefined
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Station | undefined): void
  (e: 'close'): void
}>()

const global = useGlobalStore()

const data = ref<Details>()
const selectedStation = ref<Station | undefined>()
const selectorRef = ref<{ focus: () => void } | null>(null)

const tabs = ref(['AIP', 'Charts'])
const coords = ref('')

watch(
  () => props.visible,
  async (isVisible) => {
    if (!isVisible) return
    await nextTick()
    selectorRef.value?.focus()
  }
)

watch(
  () => props.modelValue,
  (newVal) => {
    selectedStation.value = newVal
  }
);

watch(
  () => selectedStation.value,
  (newVal) => {
    if (!newVal) {
      data.value = undefined
      emit('update:modelValue', undefined)
    } else {
      data.value = newVal.details
      const fac = 1 / global.map!.stationMappingSize * global.map!.pixels
      showPointerCoord({x: newVal.posx * fac, y: newVal.posy * fac})
      if (newVal.details?.charts && newVal.details.charts.length > 0)
        tabs.value = ['AIP', 'Charts']
      else
        tabs.value = ['AIP']
      emit('update:modelValue', newVal)
    }
  }
)

const createUrl = (chart: Chart) => {
  const baseUrl = `${cdnUrl}/${global.map!.folder}/charts`
  if (chart.url.endsWith('.png'))
    return `${baseUrl}/${chart.url}`
  else
    return `${baseUrl}/${chart.url}#page=${chart.page || 1}#&view=Fit&toolbar=0`
}

function openChart(chart: Chart) {
  const w = chart.width || 610;
  const h = chart.height || 835;
  const x = (window.screen.width - w) / 2;
  const y = (window.screen.height - h) / 2;
  const url = createUrl(chart)
  const features = `width=${w},height=${h},left=${x},top=${y}`
  window.open(url, 'popup', features)
  return false
}

const showPointerCoord = (pos: Point) => {
  const strCrd = strLatLong(canvasPos2LatLong(pos))
  coords.value = `${strCrd.lat}, ${strCrd.long}`
}

const canvasPos2LatLong = (point: Point): Coord => {
  const map = global.map
  if (!map) return {lat: 0, long: 0}
  const dx = point.x * map.resolution;
  const dy = (map.pixels - point.y) * map.resolution;
  return map2LatLong({lat: map.datum.lat, long: map.datum.long}, {x: dx, y: dy});
}


</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <station-selector ref="selectorRef" :stations="global.map!.stations" v-model="selectedStation" style="width: 100%;"/>
    <tool-spacer/>
    <div v-if="data">
      <tool-tabs :tabs="tabs">
        <template #AIP>
          <tool-spacer/>
          <div class="data">{{ coords }}</div>
          <tool-spacer/>
          <tool-listitem label="Elevation" :value="data.elev"/>
          <tool-listitem label="RWY" :value="data.rwy"/>
          <tool-listitem label="TCN" :value="data.tcn"/>
          <tool-listitem label="ATIS" :value="data.atis"/>
          <tool-listitem label="OPS" :value="data.ops" v-if="data.ops"/>
          <tool-listitem label="GND" :value="data.gnd"/>
          <tool-listitem label="TWR" :value="data.twr"/>
          <tool-listitem label="APP/DEP" :value="data.appdep"/>
        </template>
        <template #Charts>
          <tool-spacer/>
          <ul class="charts">
            <li v-for="chart in data.charts" v-bind:key="chart.name">
              <span @click.stop="openChart(chart)">{{ chart.name }}</span>
            </li>
          </ul>
        </template>
      </tool-tabs>
    </div>
    <div v-else>
      <h4 v-if="selectedStation" style="text-align: center">
        No data available for <br/>{{ selectedStation.type }} {{ selectedStation.name }}
      </h4>
      <h4 v-else style="text-align: center">no station selected</h4>
    </div>
  </tool-window>
</template>

<style scoped>
li {
  padding: 1px;
}

span {
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: underline;
}

span:hover {
  background-color: #ddd;
  padding: 1px 2px;
}

.charts {
  list-style-type: none;
  padding: 0;
  margin: 0;
  font-size: medium;
  font-family: monospace;
}

.data {
  font-size: medium;
  font-weight: bolder;
  font-family: monospace;
}

</style>
