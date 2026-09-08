<script setup lang="ts">

import ToolWindow from "@/components/forms/tool-window.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import ToolCheckbox from "@/components/forms/tool-checkbox.vue";
import ToolDropdown from "@/components/forms/tool-dropdown.vue";
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";
import ToolNumberfield from "@/components/forms/tool-numberfield.vue";
import {reactive} from "vue";
import {useSettingsStore} from "@/stores/settings.ts";
import ToolTitle from "@/components/forms/tool-title.vue";

const settings = useSettingsStore()

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'btnClick'])

// function btnClick(sender: string) {
//   emit('btnClick', sender)
// }


interface GFSConfig {
  date: string;
  cycle: string;
  forecast: number;
}

const maxForecast = 384 // TODO: move to settings ?

const gfs = reactive<GFSConfig>({
  date: "20230531",
  cycle: "06",
  forecast: 42
})

const alts: ValueCaptionPair[] = [
  {value: "0", caption: "0"},
  {value: "1", caption: "3000"},
  {value: "2", caption: "6000"},
  {value: "3", caption: "9000"},
  {value: "4", caption: "12000"},
  {value: "5", caption: "18000"},
  {value: "6", caption: "24000"},
  {value: "7", caption: "30000"},
  {value: "8", caption: "40000"},
  {value: "9", caption: "50000"}
]
//
// const wx: ValueCaptionPair[] = [
//   {value: "2", caption: "Temperature"},
//   {value: "1", caption: "Winds"},
//   {value: "3", caption: "Isobaric"},
//   {value: "0", caption: "Doppler"},
//   {value: "4", caption: "Clouds"}
// ]

const filters: ValueCaptionPair[] = [
  {value: "0", caption: "Default"},
  {value: "3", caption: "Dimmed"},
  {value: "1", caption: "Grayscale"},
  {value: "2", caption: "Sepia"},
  {value: "4", caption: "Night"}
]

const cycles: ValueCaptionPair[] = [
  {value: "00", caption: "0000Z"},
  {value: "06", caption: "0600Z"},
  {value: "12", caption: "1200Z"},
  {value: "18", caption: "1800Z"}
]

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-title text="Weather"/>

    <tool-section name="Common"/>
    <tool-checkbox label="Show METAR" v-model="settings.viz.mt"/>
    <tool-dropdown name="filter" label="Map Filter" :options="filters" v-model="settings.settings.map.filter"/>

    <tool-section name="Layers"/>
    <tool-checkbox label="Temperature" v-model="settings.settings.weather.wxLayers.temps"/>
    <tool-checkbox label="Wind" v-model="settings.settings.weather.wxLayers.winds"/>
    <template v-if="settings.settings.weather.wxLayers.winds">
      <tool-dropdown name="altitudes" label="Altitude" :options="alts" v-model="settings.settings.weather.altitude"/>
    </template>
    <tool-checkbox label="Isobaric" v-model="settings.settings.weather.wxLayers.isobaric"/>
    <tool-checkbox label="Doppler" v-model="settings.settings.weather.wxLayers.doppler"/>
    <tool-checkbox label="Clouds" v-model="settings.settings.weather.wxLayers.clouds"/>
    <template v-if="settings.settings.weather.wxLayers.clouds">
      <tool-checkbox label="Colored Cloud-Base" v-model="settings.settings.weather.colorCloudBase"/>
    </template>

    <tool-section name="Global Forecast System"/>
    <tool-dropdown id="gfs-date" name="date" label="Date" v-model="gfs.date">
      <option value="20230531">May 31, 2023</option>
    </tool-dropdown>
    <tool-dropdown id="gfs-cycle" name="cycle" label="Cycle" :options="cycles" v-model="gfs.cycle"/>
    <tool-numberfield id="gfs-off" name="offset" label="Forecast" :min="1" :max="maxForecast" v-model="gfs.forecast" width="60px"/>

  </tool-window>
</template>

<style scoped>
.checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
