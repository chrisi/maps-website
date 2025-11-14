<script setup lang="ts">

import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import ToolButton from "@/components/forms/tool-button.vue";
import ToolDropdown from "@/components/forms/tool-dropdown.vue";
import ToolInput from "@/components/forms/tool-input.vue";
import ToolTextfield from "@/components/forms/tool-textfield.vue";
import ToolRow from "@/components/forms/tool-row.vue";
import ToolSection from "@/components/forms/tool-section.vue";

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

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-tabs :tabs="['Settings','Connectivity']">
      <template #Settings>
        <tool-section name="Common"/>

        <input type="checkbox" id="unit" name="imperial" onchange="selectUnit(this);">
        <label for="unit">Imperial Units</label>

        <tool-section name="Chart"/>

        <tool-dropdown id="alt-select" name="altitudes" label="Wind Alt." onchange="selectAltitude(this);">
          <option value="0">0</option>
          <option value="1">3000</option>
          <option value="2">6000</option>
          <option value="3">9000</option>
          <option value="4">12000</option>
          <option value="5">18000</option>
          <option value="6">24000</option>
          <option value="7">30000</option>
          <option value="8">40000</option>
          <option value="9">50000</option>
        </tool-dropdown>
        <tool-dropdown id="wx-select" name="weather" label="Weather" onchange="selectChart(this);">
          <option value="2">Temperature</option>
          <option value="1">Winds</option>
          <option value="3">Isobar</option>
          <option value="0">Doppler</option>
          <option value="4">Clouds</option>
        </tool-dropdown>
        <tool-dropdown id="flt-select" name="filter" label="Map Filter" onchange="selectFilter(this);">
          <option value="0">Default</option>
          <option value="3">Dimmed</option>
          <option value="1">Grayscale</option>
          <option value="2">Sepia</option>
          <option value="4">Night</option>
        </tool-dropdown>

        <tool-section name="Visibility"/>

        <input type="checkbox" id="bullseye_hide" name="hide_be" value="on" onchange="selectVisibility(this);">
        <label for="bullseye_hide">Hide Bullseye</label><br>
        <input type="checkbox" id="mission_hide" name="hide_ms" value="on" onchange="selectVisibility(this);">
        <label for="mission_hide">Hide Mission</label><br>
        <input type="checkbox" id="weather_hide" name="hide_wx" value="on" onchange="selectVisibility(this);">
        <label for="weather_hide">Hide Weather</label><br>
        <input type="checkbox" id="whitebrd_hide" name="hide_wb" value="on" onchange="selectVisibility(this);">
        <label for="whitebrd_hide">Hide Whiteboard</label><br>
        <input type="checkbox" id="coordinates_hide" name="hide_xy" checked value="on" onchange="selectVisibility(this);">
        <label for="coordinates_hide">Hide Coordinates</label><br><br>

        <tool-button id="save" icon="/common/assets/icon_save.png" @click="btnClick"/>
        <tool-button id="clear" icon="/common/assets/icon_clear.png" @click="btnClick"/>
        <tool-button id="reset" icon="/common/assets/icon_reset.png" @click="btnClick"/>
      </template>

      <template #Connectivity>
        <tool-section name="Collaboration"/>

        <input type="checkbox" id="imcs-secure" value="on" onchange="changedIMCS(this);">
        <label for="imcs-secure">Secure Connection</label>

        <div style="padding: 4px;"></div>
        <tool-textfield id="imcs-callsign" name="callsign" label="Callsign" onchange="changedIMCS(this);"/>
        <tool-textfield id="imcs-session" name="session" label="Session" onchange="changedIMCS(this);"/>
        <tool-textfield id="imcs-host" name="host" label="Host" value="collab.falcon-bms.com" onchange="changedIMCS(this);"/>
        <tool-textfield id="imcs-port" name="port" label="Port" onchange="changedIMCS(this);"/>
        <tool-row>
          <div style="text-align: end; width: 100%; padding-top: 10px">
            <button id="imcs-connection" onclick="button(event)">&nbsp;Join&nbsp;</button>
          </div>
        </tool-row>

        <tool-section name="Global Forecast System"/>

        <tool-dropdown id="gfs-date" name="date" label="Date">
          <option value="20230531">May 31, 2023</option>
        </tool-dropdown>
        <tool-dropdown id="gfs-cycle" name="cycle" label="Cycle">
          <option value="00">0000Z</option>
          <option value="06">0600Z</option>
          <option value="12">1200Z</option>
          <option value="18">1800Z</option>
        </tool-dropdown>
        <tool-input for="gfs-off" label="Forecast">
          <input type="number" id="gfs-off" name="offset" min="1" max="384" value="1" step="1" required style="width:80px">
        </tool-input>

        <tool-button id="download" icon="/common/assets/icon_download.png" @click="btnClick"/>
        <tool-button id="export" icon="/common/assets/icon_save.png" @click="btnClick"/>
        <!--<tool-button id="gfs-fetch" icon="/common/assets/icon_fetchpng" @click="btnClick(event)"/>-->
      </template>
    </tool-tabs>
  </tool-window>
</template>

<style scoped>

</style>
