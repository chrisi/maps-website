<script setup lang="ts">

import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import ToolRow from "@/components/forms/tool-row.vue";
import ToolButton from "@/components/forms/tool-button.vue";
import ToolTextfield from "@/components/forms/tool-textfield.vue";
import ToolCheckbox from "@/components/forms/tool-checkbox.vue";
import ToolNumberfield from "@/components/forms/tool-numberfield.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import {ref} from "vue";
import {useSettingsStore} from "@/stores/settings.ts";
import {useGlobalStore} from "@/stores/global.ts";
import ToolTitle from "@/components/forms/tool-title.vue";

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

const imperialUnits = ref(true)

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-title text="Settings"/>
    <tool-spacer/>
    <tool-tabs :tabs="['Connectivity','Display']" :adaptive="false">
      <template #Display>
        <tool-section name="Common"/>
        <tool-checkbox id="unit" name="imperial" label="Imperial Units" v-model="imperialUnits"/>

        <tool-section name="Visibility"/>
        <div class="checkbox-grid">
          <tool-checkbox label="Coordinates" v-model="settings.viz.xy"/>
          <tool-checkbox label="Bullseye" v-model="settings.viz.be"/>
          <tool-checkbox label="Mission" v-model="settings.viz.ms"/>
          <tool-checkbox label="Weather" v-model="settings.viz.wx"/>
          <tool-checkbox label="Whiteboard" v-model="settings.viz.wb"/>
          <tool-checkbox label="Stations" v-model="settings.viz.st"/>
          <tool-checkbox label="Owner" v-model="settings.viz.ow"/>
          <tool-checkbox label="Map" v-model="settings.viz.mp"/>
          <tool-checkbox label="Aircraft" v-model="settings.viz.op"/>
        </div>
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

        <tool-spacer/>
        <tool-row>
          <div style="text-align: end; width: 100%;">
            <tool-button id="imcs-connection" icon="/icons/buttons/connect_server.png" :active="global.connectedImcs"
                         tooltip="Connect to Collaboration Server" @click="btnClick"/>
            <tool-button id="agent-connection" icon="/icons/buttons/connect_agent.png" :active="global.connectedAgent"
                         tooltip="Connect to Falcon BMS Agent" @click="btnClick"/>
          </div>
        </tool-row>
      </template>
    </tool-tabs>
  </tool-window>
</template>

<style scoped>
.checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
