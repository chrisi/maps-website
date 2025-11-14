<script setup lang="ts">

import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import ToolRow from "@/components/forms/tool-row.vue";
import ToolInput from "@/components/forms/tool-input.vue";
import ToolButton from "@/components/forms/tool-button.vue";
import ToolTextfield from "@/components/forms/tool-textfield.vue";
import ToolCheckbox from "@/components/forms/tool-checkbox.vue";
import ToolDropdown from "@/components/forms/tool-dropdown.vue";
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

function btnClick(e: Event) {
  console.log("clicked: " + (e.target as HTMLButtonElement).id)
}

function selectVisibility(e: Event) {
  console.log("selectVisibility: " + (e.target as HTMLInputElement).id)
}

function selectUnit(e: Event) {
  console.log("selectUnit: " + (e.target as HTMLInputElement).checked)
}

function changedIMCS(e: Event) {
  console.log("changedIMCS: " + (e.target as HTMLInputElement).id)
}

function selectAltitude(e: Event) {
  console.log("selectAltitude: " + (e.target as HTMLSelectElement).value)
}

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
    <tool-tabs :tabs="['Settings','Connectivity']">
      <template #Settings>
        <tool-section name="Common"/>

        <tool-checkbox id="unit" name="imperial" label="Imperial Units" @change="selectUnit"/>

        <tool-section name="Chart"/>

        <tool-dropdown id="alt-select" name="altitudes" label="Wind Alt." :options="alts" @change="selectAltitude"/>
        <tool-dropdown id="wx-select" name="weather" label="Weather" :options="wx" @change="selectAltitude"/>
        <tool-dropdown id="flt-select" name="filter" label="Map Filter" :options="filters" @change="selectAltitude"/>

        <tool-section name="Visibility"/>

        <tool-checkbox id="bullseye_hide" name="hide_be" label="Hide Bullseye" @change="selectVisibility"/>
        <tool-checkbox id="mission_hide" name="hide_ms" label="Hide Mission" @change="selectVisibility"/>
        <tool-checkbox id="weather_hide" name="hide_wx" label="Hide Weather" @change="selectVisibility"/>
        <tool-checkbox id="whitebrd_hide" name="hide_wb" label="Hide Whiteboard" @change="selectVisibility"/>
        <tool-checkbox id="coordinates_hide" name="hide_xy" label="Hide Coordinates" @change="selectVisibility"/>

        <tool-button id="save" icon="common/assets/icon_save.png" @click="btnClick"/>
        <tool-button id="clear" icon="common/assets/icon_clear.png" @click="btnClick"/>
        <tool-button id="reset" icon="common/assets/icon_reset.png" @click="btnClick"/>
      </template>

      <template #Connectivity>
        <tool-section name="Collaboration"/>

        <tool-checkbox id="imcs-secure" name="imcs-secure" label="Secure Connection" @change="changedIMCS"/>

        <div style="padding: 4px;"></div>

        <tool-textfield id="imcs-callsign" name="callsign" label="Callsign" @change="changedIMCS"/>
        <tool-textfield id="imcs-session" name="session" label="Session" @change="changedIMCS"/>
        <tool-textfield id="imcs-host" name="host" label="Host" value="collab.falcon-bms.com" @change="changedIMCS"/>
        <tool-textfield id="imcs-port" name="port" label="Port" @change="changedIMCS"/>
        <tool-row>
          <div style="text-align: end; width: 100%; padding-top: 10px">
            <button id="imcs-connection" @click="btnClick">&nbsp;Join&nbsp;</button>
          </div>
        </tool-row>

        <tool-section name="Global Forecast System"/>

        <tool-dropdown id="gfs-date" name="date" label="Date">
          <option value="20230531">May 31, 2023</option>
        </tool-dropdown>
        <tool-dropdown id="gfs-cycle" name="cycle" label="Cycle" :options="cycles"/>
        <tool-input for="gfs-off" label="Forecast">
          <input type="number" id="gfs-off" name="offset" min="1" max="384" value="1" step="1" required style="width:80px">
        </tool-input>

        <tool-button id="download" icon="common/assets/icon_download.png" @click="btnClick"/>
        <tool-button id="export" icon="common/assets/icon_save.png" @click="btnClick"/>
        <!--<tool-button id="gfs-fetch" icon="common/assets/icon_fetch.png" @click="btnClick(event)"/>-->
      </template>
    </tool-tabs>
  </tool-window>
</template>

<style scoped>

</style>
