<script setup lang="ts">

import {ref, watch} from "vue";
import type {Chart, Details, Station} from "@/model/station.ts";
import ToolWindow from "@/components/forms/tool-window.vue";
import ToolListitem from "@/components/forms/tool-listitem.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import ToolTitle from "@/components/forms/tool-title.vue";

const baseUrl = "https://cdn.falcon-bms.com/maps/04_KTO/charts/"; // TODO: centralize this

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
  <tool-window :visible="visible" @close="emit('close')">
    <div v-if="data">
      <tool-title :text="data.name"/>
      <hr style="margin: 2px 0;">
      <tool-spacer/>
      <div class="data">{{ data.lat }}&nbsp;{{ data.long }}</div>
      <tool-spacer/>
      <tool-listitem label="Elevation" :value="data.elev"/>
      <tool-listitem label="RWY" :value="data.rwy"/>
      <tool-listitem label="TCN" :value="data.tcn"/>
      <tool-listitem label="ATIS" :value="data.atis"/>
      <tool-listitem label="OPS" :value="data.ops" v-if="data.ops"/>
      <tool-listitem label="GND" :value="data.gnd"/>
      <tool-listitem label="TWR" :value="data.twr"/>
      <tool-listitem label="APP/DEP" :value="data.appdep"/>
      <tool-section name="Charts"/>
      <ul class="charts">
        <li v-for="chart in data.charts" v-bind:key="chart.name">
          <span @click.stop="openChart(chart)">{{ chart.name }}</span>
        </li>
      </ul>
    </div>
    <div v-else>
      <h4 style="text-align: center">The data for<br/>
        {{ station?.type }} {{ station?.name }}<br/>
        is not jet migrated.</h4>
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
