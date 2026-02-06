<script setup lang="ts">

import {reactive, ref, watch} from "vue";
import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTitle from "@/components/forms/tool-title.vue";
import ToolInput from "@/components/forms/tool-input.vue";
import ColorPicker from "@/components/forms/color-picker.vue";
import PureDropdown from "@/components/forms/pure-dropdown.vue";
import PureNumberfield from "@/components/forms/pure-numberfield.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import RangeSlider from "@/components/forms/range-slider.vue";
import {useSettingsStore} from "@/stores/settings.ts";
import ToolCheckbox from "@/components/forms/tool-checkbox.vue";
import ToolButton from "@/components/forms/tool-button.vue";
import {useGlobalStore} from "@/stores/global.ts";
import {DrawMode} from "@/model/mode.ts";
import ToolTextfield from "@/components/forms/tool-textfield.vue";

const settings = useSettingsStore()
const global = useGlobalStore()

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const variant = ref("d")


watch(() => global.drawMode, value => {
  // TODO placeholder
  console.log(`drawMode changed to ${value}`)
})

const btnDrawModeClick = (sender: string) => {
  switch (sender) {
    case "drawMode_freehand":
      global.drawMode = DrawMode.Freehand
      break
    case "drawMode_line":
      global.drawMode = DrawMode.Line
      break
    case "drawMode_circle":
      global.drawMode = DrawMode.Circle
      break
    case "drawMode_rect":
      global.drawMode = DrawMode.Rect
      break
    case "drawMode_text":
      global.drawMode = DrawMode.Text
      break
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
    <tool-section name="Pencil"/>
    <tool-input :variant="variant" label="Line" for="line-style">
      <div style="display: flex; width: 97%; gap: 4px;">
        <div style="flex: 5">
          <pure-dropdown id="line-style" v-model="settings.settings.whiteboard.lineStyle" style="width: 100%;">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </pure-dropdown>
        </div>
        <div style="flex: 4">
          <color-picker id="line-color" v-model="settings.settings.whiteboard.lineColor"/>
        </div>
        <div style="flex: 2">
          <pure-numberfield id="thickness" v-model="settings.settings.whiteboard.lineWidth" :min="1" :max="10" :step="1"/>
        </div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Fill" for="fill-style">
      <div style="display: flex; width: 97%; gap: 4px;">
        <div style="flex: 5">
          <pure-dropdown id="fill-style" v-model="settings.settings.whiteboard.fillStyle">
            <option value="none">None</option>
            <option value="solid">Solid</option>
          </pure-dropdown>
        </div>
        <div style="flex: 4">
          <color-picker id="fill-color" v-model="settings.settings.whiteboard.fillColor"/>
        </div>
        <div style="flex: 2"></div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Opacity" for="opacity">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 10">
          <range-slider id="opacity" v-model="settings.settings.whiteboard.opacity"/>
        </div>
        <div style="flex: 2">
          <input :value="settings.settings.whiteboard.opacity" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
    <tool-spacer/>
    <tool-section name="Shapes"/>
    <tool-button id="drawMode_freehand" icon="/common/icons/freehand.png"
                 @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Freehand"/>
    <tool-button id="drawMode_line" icon="/common/icons/line.png"
                 @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Line"/>
    <tool-button id="drawMode_circle" icon="/common/icons/circle.png"
                 @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Circle"/>
    <tool-button id="drawMode_rect" icon="/common/icons/rect.png"
                 @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Rect"/>
    <tool-button id="drawMode_text" icon="/common/icons/text.png"
                 @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Text"/>
    <template v-if="global.drawMode == DrawMode.Text">
      <tool-input :variant="variant" label="Size" for="fontSize">
        <div style="display: flex; width: 95%; gap: 8px;">
          <div style="flex: 10">
            <range-slider id="fontSize" v-model="settings.settings.whiteboard.fontSize"/>
          </div>
          <div style="flex: 2">
            <input :value="settings.settings.whiteboard.fontSize" style="width: 100%" readonly/>
          </div>
        </div>
      </tool-input>
      <tool-textfield :variant="variant" label="Text" v-model="settings.settings.whiteboard.text"/>
    </template>

    <tool-spacer/>
    <tool-section name="Delete"/>
    <tool-button id="drawMode_delete" icon="/common/icons/delete.png"
                 @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Delete"/>
    <tool-spacer/>
    <tool-section name="Debug"/>
    <tool-checkbox id="support_points" label="Show Support-Points" v-model="settings.settings.whiteboard.supportPoints"/>
  </tool-window>
</template>

<style scoped>

</style>
