<script setup lang="ts">

import {reactive} from "vue";
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";
import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import ToolDropdown from "@/components/forms/tool-dropdown.vue";
import ToolNumberfield from "@/components/forms/tool-numberfield.vue";
import ToolTextfield from "@/components/forms/tool-textfield.vue";
import ToolOutput from "@/components/forms/tool-output.vue";

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

interface Steerpoint {
  lat: string;
  long: string;
  tos: string;
}

const steer = reactive<Steerpoint>({
  lat: "N37°28.430'",
  long: "E126°27.083'",
  tos: "12:00:00"
});

const formations = reactive<ValueCaptionPair[]>([
  {value: "0", caption: "Arrowhead"},
  {value: "1", caption: "Box"},
  {value: "2", caption: "Figthing Wing"},
  {value: "3", caption: "Finger Four"},
  {value: "4", caption: "Fluid Four"},
  {value: "5", caption: "Ladder"},
  {value: "6", caption: "Line Abreast"},
  {value: "7", caption: "ResCell"},
  {value: "8", caption: "Route"},
  {value: "9", caption: "Spread"},
  {value: "10", caption: "Stack"},
  {value: "11", caption: "Trail"},
  {value: "12", caption: "Wedge"},
]);

const actions = reactive<ValueCaptionPair[]>([
  {value: "0", caption: "Nav"},
  {value: "1", caption: "Takeoff"},
  {value: "2", caption: "Push"},
  {value: "3", caption: "Split"},
  {value: "4", caption: "Refuel"},
  {value: "5", caption: "Rearm"},
  {value: "6", caption: "Pickup"},
  {value: "7", caption: "Land"},
  {value: "8", caption: "Holding Pt"},
  {value: "9", caption: "Contact"},
  {value: "10", caption: "Escord"},
  {value: "11", caption: "Sweep"},
  {value: "12", caption: "CAP"},
  {value: "13", caption: "Intercept"},
  {value: "14", caption: "Grnd Attack"},
  {value: "15", caption: "Surf Attack"},
  {value: "16", caption: "S&D"},
  {value: "17", caption: "Strike"},
  {value: "18", caption: "Bomb"},
  {value: "19", caption: "SEAD"},
  {value: "20", caption: "ELINT"},
  {value: "21", caption: "Recon"},
  {value: "22", caption: "Rescue"},
  {value: "23", caption: "ASW"},
  {value: "24", caption: "Fuel"},
  {value: "25", caption: "Air Drop"},
  {value: "26", caption: "Jamming"},
])

const emit = defineEmits(['close'])

// 24h time format: HH:MM:SS
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-tabs :tabs="['Route','Radio','Mission']">
      <template #Route>
        <tool-spacer medium/>
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between;">
          <div class="">STPT</div>
          <div class="">12</div>
          <div class="">
            <img style="padding-left: 4px;" src="/common/assets/icon_left.png" id="left" width="16" height="16" alt="left"
                 onclick="button(event)">
            <img style="padding-left: 4px;" src="/common/assets/icon_right.png" id="right" width="16" height="16" alt="right"
                 onclick="button(event)">
          </div>
        </div>
        <tool-spacer separator/>
        <tool-spacer/>
        <div class="coord">{{ steer.lat }}&nbsp;{{ steer.long }}</div>
        <tool-spacer/>
        <tool-textfield id="tos-val" name="tos" label="TOS" :value="steer.tos" :regexp="timeRegex"/>
        <tool-numberfield id="tas-val" name="tas" label="TAS" :min="150" :max="600" value="350" :step="1" unit="kts"/>
        <tool-numberfield id="alt-val" name="alt" label="Alt" :min="0" :max="45000" value="24000" :step="1" unit="ft"/>
        <tool-spacer medium/>
        <tool-output id="trk-val" name="trk" label="Track" value="110° 8.0NM"/>
        <tool-spacer medium/>
        <tool-dropdown id="formation-select" name="formation" label="Formation" :options="formations"/>
        <tool-dropdown id="enrout-select" name="enrout" label="Enroute">
          <option value="0">Nav</option>
          <option value="1">SEAD</option>
        </tool-dropdown>
        <tool-dropdown id="action-select" name="action" label="Action" :options="actions"/>
        <tool-textfield id="dur-val" name="dur" label="Duration" value="20" unit="min"/>
        <tool-spacer separator large/>
        <tool-output id="support1" label="AWACS" value="Lynx5"/>
        <tool-output id="support2" label="Tanker" value="Texaco"/>
        <tool-spacer/>
      </template>
      <template #Radio>
      </template>
      <template #Mission>
      </template>
    </tool-tabs>
  </tool-window>
</template>

<style scoped>
.coord {
  font-size: 14px;
  font-weight: bolder;
  font-family: monospace;
  text-align: center;
}
</style>
