<script setup lang="ts">

import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import ToolRow from "@/components/forms/tool-row.vue";
import ToolButton from "@/components/forms/tool-button.vue";
import ToolTextfield from "@/components/forms/tool-textfield.vue";
import ToolCheckbox from "@/components/forms/tool-checkbox.vue";
import ToolDropdown from "@/components/forms/tool-dropdown.vue";
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";
import ToolNumberfield from "@/components/forms/tool-numberfield.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import {reactive, ref} from "vue";
import {useSettingsStore} from "@/stores/settings.ts";
import {useGlobalStore} from "@/stores/global.ts";

const settings = useSettingsStore()
const global = useGlobalStore()

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'btnClick'])

function btnClick(sender: string) {
  emit('btnClick', sender)
}

function changeChartConfig(sender: string, value: string) {
  console.log(`changeChartConfig: ${sender} -> ${value}`)
}

const imperialUnits = ref(true)

const windAltitudes = ref("4")
const weather = ref("2")
const mapFilter = ref("3")

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

const wx: ValueCaptionPair[] = [
  {value: "2", caption: "Temperature"},
  {value: "1", caption: "Winds"},
  {value: "3", caption: "Isobaric"},
  {value: "0", caption: "Doppler"},
  {value: "4", caption: "Clouds"}
]

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
    <tool-tabs :tabs="['Connectivity','Settings']">
      <template #Settings>
        <tool-section name="Common"/>
        <tool-checkbox id="unit" name="imperial" label="Imperial Units" v-model="imperialUnits"/>

        <tool-section name="Chart"/>
        <tool-dropdown id="alt-select" name="altitudes" label="Wind Alt." :options="alts" v-model="windAltitudes"
                       @change="changeChartConfig"/>
        <tool-dropdown id="wx-select" name="weather" label="Weather" :options="wx" v-model="weather" @change="changeChartConfig"/>
        <tool-dropdown id="flt-select" name="filter" label="Map Filter" :options="filters" v-model="mapFilter" @change="changeChartConfig"/>

        <tool-section name="Visibility"/>
        <tool-checkbox id="coordinates_show" label="Show Coordinates" v-model="settings.viz.xy"/>
        <tool-checkbox id="bullseye_show" label="Show Bullseye" v-model="settings.viz.be"/>
        <tool-checkbox id="mission_show" label="Show Mission" v-model="settings.viz.ms"/>
        <tool-checkbox id="weather_show" label="Show Weather" v-model="settings.viz.wx"/>
        <tool-checkbox id="whiteboard_show" label="Show Whiteboard" v-model="settings.viz.wb"/>
        <tool-checkbox id="stations_show" label="Show Stations" v-model="settings.viz.st"/>
        <tool-checkbox id="map_show" label="Show Map" v-model="settings.viz.mp"/>
        <!--        <tool-spacer medium/>-->
        <!--        <tool-button id="save" icon="/common/assets/icon_save.png" @click="btnClick"/>-->
        <!--        <tool-button id="clear" icon="/common/assets/icon_clear.png" @click="btnClick"/>-->
        <!--        <tool-button id="reset" icon="/common/assets/icon_reset.png" @click="btnClick"/>-->
      </template>

      <template #Connectivity>
        <tool-section name="Collaboration Server"/>
        <tool-checkbox id="imcs-secure" name="imcs-secure" label="Secure Connection" v-model="settings.settings.collab.secure"/>

        <tool-spacer/>
        <tool-textfield id="imcs-callsign" name="callsign" label="Callsign" v-model="settings.settings.collab.callsign"/>
        <tool-textfield id="imcs-session" name="session" label="Session" v-model="settings.settings.collab.session"/>
        <tool-textfield id="imcs-host" name="host" label="Host" v-model="settings.settings.collab.host"/>
        <tool-numberfield id="imcs-port" name="port" label="Port" v-model="settings.settings.collab.port" width="60px"/>

        <tool-section name="Falcon BMS Agent"/>
        <tool-textfield id="agent-host" name="host" label="Host" v-model="settings.settings.agent.host"/>
        <tool-numberfield id="agent-port" name="port" label="Port" v-model="settings.settings.agent.port" width="60px"/>

        <tool-section name="Global Forecast System"/>
        <tool-dropdown id="gfs-date" name="date" label="Date" v-model="gfs.date">
          <option value="20230531">May 31, 2023</option>
        </tool-dropdown>
        <tool-dropdown id="gfs-cycle" name="cycle" label="Cycle" :options="cycles" v-model="gfs.cycle"/>
        <tool-numberfield id="gfs-off" name="offset" label="Forecast" :min="1" :max="maxForecast" v-model="gfs.forecast" width="60px"/>
        <tool-spacer/>
        <tool-row>
          <div style="text-align: end; width: 100%;">
            <tool-button id="imcs-connection" icon="/common/icons/connect_server.png" :active="global.connectedImcs"
                         tooltip="Connect to Collaboration Server" @click="btnClick"/>
            <tool-button id="agent-connection" icon="/common/icons/connect_agent.png" :active="global.connectedAgent"
                         tooltip="Connect to Falcon BMS Agent" @click="btnClick"/>
          </div>
        </tool-row>
        <!--        <tool-spacer medium/>-->
        <!--        <tool-button id="download" icon="/common/assets/icon_download.png" @click="btnClick"/>-->
        <!--        <tool-button id="export" icon="/common/assets/icon_save.png" @click="btnClick"/>-->
        <!--<tool-button id="gfs-fetch" icon="common/assets/icon_fetch.png" @click="btnClick(event)"/>-->
      </template>
    </tool-tabs>
  </tool-window>
</template>

<style scoped>

</style>
