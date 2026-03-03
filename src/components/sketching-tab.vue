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
import {InputMode} from "@/model/mode.ts";
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

watch(() => global.inputMode, value => {
  // TODO placeholder
  console.log(`drawMode changed to ${value}`)
})

const btnDrawModeClick = (sender: string) => {
  switch (sender) {
    case "drawMode_freehand":
      global.inputMode = InputMode.Freehand
      break
    case "drawMode_line":
      global.inputMode = InputMode.Line
      break
    case "drawMode_ellipse":
      global.inputMode = InputMode.Ellipse
      break
    case "drawMode_rect":
      global.inputMode = InputMode.Rect
      break
    case "drawMode_text":
      global.inputMode = InputMode.Text
      break
    default:
  }
}

</script>

<template>
  <tool-button id="drawMode_freehand" icon="/common/icons/freehand.png" tooltip="Freehand"
               @click="btnDrawModeClick" :active="global.inputMode == InputMode.Freehand"/>
  <tool-button id="drawMode_line" icon="/common/icons/line.png" tooltip="Line"
               @click="btnDrawModeClick" :active="global.inputMode == InputMode.Line"/>
  <tool-button id="drawMode_rect" icon="/common/icons/rect.png" tooltip="Rectangle"
               @click="btnDrawModeClick" :active="global.inputMode == InputMode.Rect"/>
  <tool-button id="drawMode_ellipse" icon="/common/icons/circle.png" tooltip="Circle"
               @click="btnDrawModeClick" :active="global.inputMode == InputMode.Ellipse"/>
  <tool-button id="drawMode_text" icon="/common/icons/text.png" tooltip="Text"
               @click="btnDrawModeClick" :active="global.inputMode == InputMode.Text"/>
  <tool-spacer/>
  <template v-if="global.inputMode == InputMode.Text">
    <tool-input :variant="variant" label="Color" for="text-color">
      <div style="display: flex; width: 100%; gap: 4px;">
        <div style="flex: 12">
          <color-picker id="text-color" v-model="settings.settings.whiteboard.line.color"/>
        </div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Opacity" for="text-opacity">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 9">
          <range-slider id="text-opacity" v-model="settings.settings.whiteboard.line.opacity"/>
        </div>
        <div style="flex: 3">
          <input :value="settings.settings.whiteboard.line.opacity" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Size" for="text-size">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 9">
          <range-slider id="text-size" v-model="settings.settings.whiteboard.fontSize"/>
        </div>
        <div style="flex: 3">
          <input :value="settings.settings.whiteboard.fontSize" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
    <tool-textfield :variant="variant" label="Text" v-model="settings.settings.whiteboard.text"/>
  </template>


  <template v-if="global.inputMode != InputMode.Text && global.inputMode != InputMode.Delete">
    <tool-input :variant="variant" label="Line" for="line-style">
      <div style="display: flex; width: 97%; gap: 4px;">
        <div style="flex: 5">
          <pure-dropdown v-model="settings.settings.whiteboard.line.style" style="width: 100%;">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </pure-dropdown>
        </div>
        <div style="flex: 3">
          <color-picker v-model="settings.settings.whiteboard.line.color"/>
        </div>
        <div style="flex: 3">
          <pure-numberfield v-model="settings.settings.whiteboard.line.width" :min="1" :max="10" :step="1"/>
        </div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Opacity" for="line-opacity">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 9">
          <range-slider id="line-opacity" v-model="settings.settings.whiteboard.line.opacity"/>
        </div>
        <div style="flex: 3">
          <input :value="settings.settings.whiteboard.line.opacity" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
  </template>
  <template v-if="global.inputMode == InputMode.Ellipse || global.inputMode == InputMode.Rect">
    <tool-input :variant="variant" label="Fill" for="fill-style">
      <div style="display: flex; width: 97%; gap: 4px;">
        <div style="flex: 5">
          <pure-dropdown v-model="settings.settings.whiteboard.fill.style">
            <option value="none">None</option>
            <option value="solid">Solid</option>
          </pure-dropdown>
        </div>
        <div style="flex: 3">
          <color-picker v-model="settings.settings.whiteboard.fill.color"/>
        </div>
        <div style="flex: 3"></div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Opacity" for="fill-opacity">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 9">
          <range-slider id="fill-opacity" v-model="settings.settings.whiteboard.fill.opacity"/>
        </div>
        <div style="flex: 3">
          <input :value="settings.settings.whiteboard.fill.opacity" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
  </template>


  <template v-if="global.inputMode == InputMode.Freehand">
    <tool-section name="Debug"/>
    <tool-checkbox id="support_points" label="Show Support-Points" v-model="settings.settings.whiteboard.supportPoints"/>
  </template>
</template>

<style scoped>

</style>
