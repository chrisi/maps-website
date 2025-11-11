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

const details = ref<Details>()

watch(
  () => props.station,
  (newVal) => {
    if (!newVal)
      details.value = undefined
    else
      details.value = newVal.details
  }
)

const createUrl = (chart: Chart) => {
  return `${baseUrl}/${chart.url}#page=${chart.page}#&view=Fit&toolbar=0`
}

</script>

<template>
  <div class="modal" v-if="props.visible">
    <div class="modal-content" v-if="details">
      <h4 class="title center">{{ details.name }}</h4>
      <hr style="margin: 0">
      <table class="table">
        <tbody>
        <tr>
          <td colspan="2" class="data">{{ details.lat }}&nbsp;{{ details.long }}</td>
        </tr>
        <tr>
          <td class="label">Elevation:</td>
          <td class="data">{{ details.elev }}</td>
        </tr>
        <tr>
          <td class="label">RWY:</td>
          <td class="data">{{ details.rwy }}</td>
        </tr>
        <tr>
          <td class="label">TCN:</td>
          <td class="data">{{ details.tcn }}</td>
        </tr>
        <tr>
          <td class="label">ATIS:</td>
          <td class="data">{{ details.atis }}</td>
        </tr>
        <tr v-if="details.ops">
          <td class="label">OPS:</td>
          <td class="data">{{ details.ops }}</td>
        </tr>
        <tr>
          <td class="label">GND:</td>
          <td class="data">{{ details.gnd }}</td>
        </tr>
        <tr>
          <td class="label">TWR:</td>
          <td class="data">{{ details.twr }}</td>
        </tr>
        <tr>
          <td class="label">APP/DEP:</td>
          <td class="data">{{ details.appdep }}</td>
        </tr>
        </tbody>
      </table>
      <h4 class="title" style="padding-top: 10px">Charts</h4>
      <hr style="margin: 0">
      <ul class="charts">
        <li v-for="chart in details.charts" v-bind:key="chart.name">
          <a :href="createUrl(chart)" target="_blank">{{ chart.name }}</a></li>
      </ul>
    </div>
  </div>
</template>

<style scoped>

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

.modal {
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  background-color: rgba(0, 0, 0, 0);
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
