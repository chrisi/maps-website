<script setup lang="ts">

import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import SketchingTab from "@/components/sketching-tab.vue";
import SymbolsTab from "@/components/symbols-tab.vue";
import ToolTitle from "@/components/forms/tool-title.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import {DrawMode} from "@/model/mode.ts";
import ToolButton from "@/components/forms/tool-button.vue";
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

const emit = defineEmits(['close'])

const btnDrawModeClick = (sender: string) => {
  switch (sender) {
    case "drawMode_delete":
      global.drawMode = DrawMode.Delete
      break
    default:
  }
}

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-title text="Whiteboard"/>
    <tool-spacer/>
    <tool-tabs :tabs="['Sketching','C2-Symbols']">
      <template #Sketching>
        <tool-spacer/>
        <sketching-tab :visible="true"/>
      </template>
      <template #C2-Symbols>
        <tool-spacer/>
        <symbols-tab :visible="true"/>
      </template>
    </tool-tabs>
    <div style="display: flex; justify-content: flex-end;">
      <tool-button id="drawMode_delete" icon="/common/icons/delete.png" @click="btnDrawModeClick"
                   :active="global.drawMode == DrawMode.Delete"/>
    </div>
  </tool-window>
</template>

<style scoped>

</style>
