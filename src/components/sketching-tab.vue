<script setup lang="ts">

import {ref, watch} from "vue";
import ToolInput from "@/components/forms/tool-input.vue";
import ColorPicker from "@/components/forms/color-picker.vue";
import PureDropdown from "@/components/forms/pure-dropdown.vue";
import PureNumberfield from "@/components/forms/pure-numberfield.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import RangeSlider from "@/components/forms/range-slider.vue";
import {useSettingsStore} from "@/stores/settings.ts";
import ToolCheckbox from "@/components/forms/tool-checkbox.vue";
import ToolButton from "@/components/forms/tool-button.vue";
import {useGlobalStore} from "@/stores/global.ts";
import {DrawMode} from "@/model/mode.ts";
import ToolTextfield from "@/components/forms/tool-textfield.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";

const settings = useSettingsStore()
const global = useGlobalStore()

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

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
    case "drawMode_ellipse":
      global.drawMode = DrawMode.Ellipse
      break
    case "drawMode_rect":
      global.drawMode = DrawMode.Rect
      break
    case "drawMode_text":
      global.drawMode = DrawMode.Text
      break
    default:
  }
}

</script>

<template>
  <tool-button id="drawMode_freehand" icon="/common/icons/freehand.png"
               @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Freehand"/>
  <tool-button id="drawMode_line" icon="/common/icons/line.png"
               @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Line"/>
  <tool-button id="drawMode_rect" icon="/common/icons/rect.png"
               @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Rect"/>
  <tool-button id="drawMode_ellipse" icon="/common/icons/circle.png"
               @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Ellipse"/>
  <tool-button id="drawMode_text" icon="/common/icons/text.png"
               @click="btnDrawModeClick" :active="global.drawMode == DrawMode.Text"/>
  <tool-spacer/>
  <template v-if="global.drawMode == DrawMode.Text">
    <tool-input :variant="variant" label="Color" for="line-style">
      <div style="display: flex; width: 100%; gap: 4px;">
        <div style="flex: 12">
          <color-picker v-model="settings.settings.whiteboard.lineColor"/>
        </div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Opacity" for="opacity">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 9">
          <range-slider v-model="settings.settings.whiteboard.opacity"/>
        </div>
        <div style="flex: 3">
          <input :value="settings.settings.whiteboard.opacity" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Size" for="fontSize">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 9">
          <range-slider v-model="settings.settings.whiteboard.fontSize"/>
        </div>
        <div style="flex: 3">
          <input :value="settings.settings.whiteboard.fontSize" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
    <tool-textfield :variant="variant" label="Text" v-model="settings.settings.whiteboard.text"/>
  </template>
  <template v-if="global.drawMode != DrawMode.Text && global.drawMode != DrawMode.Delete">
    <tool-input :variant="variant" label="Line" for="line-style">
      <div style="display: flex; width: 97%; gap: 4px;">
        <div style="flex: 5">
          <pure-dropdown v-model="settings.settings.whiteboard.lineStyle" style="width: 100%;">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </pure-dropdown>
        </div>
        <div style="flex: 3">
          <color-picker v-model="settings.settings.whiteboard.lineColor"/>
        </div>
        <div style="flex: 3">
          <pure-numberfield v-model="settings.settings.whiteboard.lineWidth" :min="1" :max="10" :step="1"/>
        </div>
      </div>
    </tool-input>
  </template>
  <template v-if="global.drawMode == DrawMode.Freehand">
    <tool-section name="Debug"/>
    <tool-checkbox id="support_points" label="Show Support-Points" v-model="settings.settings.whiteboard.supportPoints"/>
  </template>
  <template v-if="global.drawMode == DrawMode.Ellipse || global.drawMode == DrawMode.Rect">
    <tool-input :variant="variant" label="Fill" for="fill-style">
      <div style="display: flex; width: 97%; gap: 4px;">
        <div style="flex: 5">
          <pure-dropdown v-model="settings.settings.whiteboard.fillStyle">
            <option value="none">None</option>
            <option value="solid">Solid</option>
          </pure-dropdown>
        </div>
        <div style="flex: 3">
          <color-picker v-model="settings.settings.whiteboard.fillColor"/>
        </div>
        <div style="flex: 3"></div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Opacity" for="opacity">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 9">
          <range-slider v-model="settings.settings.whiteboard.opacity"/>
        </div>
        <div style="flex: 3">
          <input :value="settings.settings.whiteboard.opacity" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
  </template>
</template>

<style scoped>

</style>
