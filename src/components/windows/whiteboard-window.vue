<script setup lang="ts">

import {ref} from "vue";
import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import SketchingTab from "@/components/windows/sketching-tab.vue";
import SymbolsTab from "@/components/windows/symbols-tab.vue";
import ToolTitle from "@/components/forms/tool-title.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import {InputMode, OverlayMode} from "@/model/mode.ts";
import ToolButton from "@/components/forms/tool-button.vue";
import {useGlobalStore} from "@/stores/global.ts";
import type {OverlayManager} from "@/scripts/overlays/OverlayManager.ts";
import type {ImcsClient} from "@/scripts/ImcsClient.ts";
import ConfirmationDialog from "@/components/forms/confirmation-dialog.vue";

const global = useGlobalStore()

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  overlayManager: {
    type: Object as () => OverlayManager,
    required: true
  },
  imcsClient: {
    type: Object as () => ImcsClient,
    required: true
  }
})

const emit = defineEmits(['close'])

const showClearConfirm = ref(false)

const btnClearClick = () => {
  console.log("clear clicked")
  showClearConfirm.value = true
}

const confirmClear = () => {
  showClearConfirm.value = false
  global.whiteboard.shapes = []
  global.whiteboard.symbols = []
  props.overlayManager.redraw()
  props.imcsClient.msgSendClear()
}

const btnSaveClick = () => {
  const blob = new Blob([JSON.stringify(global.whiteboard, null, 2)], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `whiteboard-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wb`
  a.click()
  URL.revokeObjectURL(url)
}

const btnInputModeClick = (sender: string) => {
  switch (sender) {
    case "inputMode_delete":
      global.inputMode = InputMode.Delete
      break
    default:
  }
}

const tabChanged = (sender: string) => {
  switch (sender) {
    case "C2-Symbols":
      //global.inputMode = InputMode.Symbol
      global.mode = OverlayMode.Symbol
      break
    case "Sketching":
      //global.inputMode = InputMode.Freehand
      global.mode = OverlayMode.Whiteboard
      break
    default:
  }
}

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-title text="Whiteboard"/>
    <tool-spacer/>
    <tool-tabs :tabs="['Sketching','C2-Symbols']" @tab-changed="tabChanged">
      <template #Sketching>
        <tool-spacer/>
        <sketching-tab :visible="true"/>
      </template>
      <template #C2-Symbols>
        <tool-spacer/>
        <symbols-tab :visible="true"/>
      </template>
    </tool-tabs>
    <tool-spacer/>
    <div style="display: flex; justify-content: space-between;">
      <tool-button id="saveSketch" icon="/common/assets/icon_save.png" @click="btnSaveClick"/>
      <tool-button id="inputMode_delete" icon="/icons/buttons/eraser.png" @click="btnInputModeClick"
                   :active="global.inputMode == InputMode.Delete"/>
      <tool-button id="clearSketch" icon="/icons/buttons/delete.png" @click="btnClearClick"/>
    </div>
  </tool-window>
  <confirmation-dialog :visible="showClearConfirm" message="Really clear whiteboard?"
                       @confirm="confirmClear" @cancel="showClearConfirm = false"/>
</template>

<style scoped>

</style>
