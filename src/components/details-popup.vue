<script setup lang="ts">

import type {Chart, Details, Station} from "@/model/Station.ts";
import {ref, watch} from "vue";

const baseUrl = "https://cdn.falcon-bms.com/maps/04_KTO/charts/";

const props = defineProps({
  station: {
    type: Object as () => Station | undefined
  },
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const data = ref<Details>()

watch(
  () => props.station,
  (newVal) => {
    if (!newVal)
      data.value = undefined
    else
      data.value = newVal.details
  }
)

const createUrl = (chart: Chart) => {
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

</script>

<template>
  <div class="modal-backdrop" v-if="props.visible" @click="emit('close')">
    <div class="modal-content" v-if="data">
      <h4 class="title center">{{ data.name }}</h4>
      <hr class="sep">
      <table class="table spc">
        <tbody>
        <tr>
          <td colspan="2" class="data" style="padding: 5px 0">{{ data.lat }}&nbsp;{{ data.long }}
          </td>
        </tr>
        <tr>
          <td class="label">Elevation:</td>
          <td class="data">{{ data.elev }}</td>
        </tr>
        <tr>
          <td class="label">RWY:</td>
          <td class="data">{{ data.rwy }}</td>
        </tr>
        <tr>
          <td class="label">TCN:</td>
          <td class="data">{{ data.tcn }}</td>
        </tr>
        <tr>
          <td class="label">ATIS:</td>
          <td class="data">{{ data.atis }}</td>
        </tr>
        <tr v-if="data.ops">
          <td class="label">OPS:</td>
          <td class="data">{{ data.ops }}</td>
        </tr>
        <tr>
          <td class="label">GND:</td>
          <td class="data">{{ data.gnd }}</td>
        </tr>
        <tr>
          <td class="label">TWR:</td>
          <td class="data">{{ data.twr }}</td>
        </tr>
        <tr>
          <td class="label">APP/DEP:</td>
          <td class="data">{{ data.appdep }}</td>
        </tr>
        </tbody>
      </table>
      <h4 class="title" style="padding-top: 10px">Charts</h4>
      <hr class="sep">
      <ul class="charts">
        <li v-for="chart in data.charts" v-bind:key="chart.name">
          <span @click.stop="openChart(chart)">{{ chart.name }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>

.spc {
  padding: 5px 0;
}

.sep {
  margin: 2px 0;
}

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

.center {
  text-align: center;
}

.title {
  margin: 0;
  font-family: sans-serif;
  font-weight: bold;
}

.charts {
  list-style-type: none;
  padding: 0;
  margin: 0;
  font-size: medium;
  font-family: monospace;
}

.table {
  padding: 0;
  margin: 0;
  border-spacing: 0;
}

.table td {
  padding: 0;
}

.label {
  width: 90px;
  font-size: medium;
  font-family: monospace;
}

.data {
  font-size: medium;
  font-weight: bolder;
  font-family: monospace;
}

.modal-backdrop {
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0; top: 0;
  width: 100%; height: 100%;
  background-color: rgba(1, 1, 1, 0);
}

.modal-content {
  position: fixed;
  left: 55px;
  top: 66px;
  background-color: rgba(245, 245, 245, 1);
  border: 1px solid black;
  box-shadow: 5px 5px 5px #222;
  padding: 8px;
  width: 240px;
}

</style>
