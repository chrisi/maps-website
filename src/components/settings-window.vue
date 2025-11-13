<script setup lang="ts">

import ToolWindow from "@/components/tool-window.vue";
import ToolTabs from "@/components/tool-tabs.vue";

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-tabs :tabs="['Settings','Connectivity']">
      <template #Settings>
        <h4>Common</h4>
        <hr>
        <input type="checkbox" id="unit" name="imperial" onchange="selectUnit(this);">
        <label for="unit">Imperial Units</label>
        <h4>Chart</h4>
        <hr>
        <table>
          <tbody>
          <tr>
            <td><label for="alt-select">Wind Alt.</label></td>
            <td><select name="altitudes" id="alt-select" onchange="selectAltitude(this);" style="width:110px">
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
            </select></td>
          </tr>
          <tr>
            <td><label for="wx-select">Weather</label></td>
            <td><select name="weather" id="wx-select" onchange="selectChart(this);" style="width:110px">
              <option value="2">Temperature</option>
              <option value="1">Winds</option>
              <option value="3">Isobar</option>
              <option value="0">Doppler</option>
              <option value="4">Clouds</option>
            </select></td>
          </tr>
          <tr>
            <td><label for="flt-select">Map Filter</label></td>
            <td><select name="filter" id="flt-select" onchange="selectFilter(this);" style="width:110px">
              <option value="0">Default</option>
              <option value="3">Dimmed</option>
              <option value="1">Grayscale</option>
              <option value="2">Sepia</option>
              <option value="4">Night</option>
            </select></td>
          </tr>
          </tbody>
        </table>

        <h4>Visibility</h4>
        <hr>
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
        <button><img src="/common/assets/icon_save.png" id="save" width="32" height="32" alt="save" onclick="button(event)"></button>
        <button><img src="/common/assets/icon_clear.png" id="clear" width="32" height="32" alt="clear" onclick="button(event)"></button>
        <button><img src="/common/assets/icon_reset.png" id="reset" width="32" height="32" alt="reset" onclick="button(event)"></button>
      </template>

      <template #Connectivity>
        <h4>Collaboration</h4>
        <hr>
        <input type="checkbox" id="imcs-secure" value="on" onchange="changedIMCS(this);">
        <label for="imcs-secure">&nbsp;Secure Connection</label><br><br>
        <table>
          <tbody>
          <tr>
            <td align="right">Callsign</td>
            <td><input type="text" id="imcs-callsign" name="callsign" onchange="changedIMCS(this);" style="width:130px"></td>
          </tr>
          <tr>
            <td align="right">Session</td>
            <td><input type="text" id="imcs-session" name="session" onchange="changedIMCS(this);" style="width:130px"></td>
          </tr>
          <tr>
            <td align="right">Address</td>
            <td><input type="text" id="imcs-host" name="host" value="collab.falcon-bms.com" onchange="changedIMCS(this);"
                       style="width:130px"></td>
          </tr>
          <tr>
            <td align="right" valign="top">Port</td>
            <td>
              <input type="text" id="imcs-port" name="port" value="443" onchange="changedIMCS(this);" style="width:50px"><br>
              <button id="imcs-connection" style="float: right; width:50px" onclick="button(event)">&nbsp;Join&nbsp;</button>
            </td>
          </tr>
          </tbody>
        </table>

        <h4>Global Forecast System</h4>
        <hr>
        <table>
          <tbody>
          <tr>
            <td align="right">Date</td>
            <td>
              <select id="gfs-date" name="date" style="width:100px">
                <option value="20230531">May 31, 2023</option>
              </select></td>
          </tr>
          <tr>
            <td align="right">Cycle</td>
            <td>
              <select name="cycle" id="gfs-cycle" style="width:64px">
                <option value="00">0000Z</option>
                <option value="06">0600Z</option>
                <option value="12">1200Z</option>
                <option value="18">1800Z</option>
              </select>
            </td>
          </tr>
          <tr>
            <td align="right" valign="top">Forecast</td>
            <td><input type="number" id="gfs-off" name="offset" min="1" max="384" value="1" step="1" required style="width:60px"></td>
          </tr>
          <!-- <button id="gfs-fetch" style="float: right;" onclick="button(event)">&nbspFetch&nbsp</button></td></tr>-->
          </tbody>
        </table>

        <button><img src="/common/assets/icon_download.png" id="download" width="32" height="32" alt="download" onclick="button(event)">
        </button>
        <button><img src="/common/assets/icon_save.png" id="export" width="32" height="32" alt="export" onclick="button(event)"></button>
      </template>
    </tool-tabs>
  </tool-window>
</template>

<style scoped>
button {
  margin: 4px;
}

h4 {
  margin: 12px 0 0;
  font-family: sans-serif;
  font-weight: bold;
}

hr {
  margin: 4px 0;
}
</style>
