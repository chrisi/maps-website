<script setup lang="ts">

import {reactive, ref} from "vue";
import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTitle from "@/components/forms/tool-title.vue";
import ToolInput from "@/components/forms/tool-input.vue";
import ColorPicker from "@/components/forms/color-picker.vue";
import PureDropdown from "@/components/forms/pure-dropdown.vue";
import PureNumberfield from "@/components/forms/pure-numberfield.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";
import RangeSlider from "@/components/forms/range-slider.vue";
import {useSettingsStore} from "@/stores/settings.ts";

const settings = useSettingsStore()

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const variant = ref("d")

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
    <tool-section name="Eraser"/>
    <tool-input :variant="variant" label="Size" for="eraser-size">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 10">
          <range-slider id="eraser-size" v-model="settings.settings.whiteboard.eraserSize"/>
        </div>
        <div style="flex: 2">
          <input :value="settings.settings.whiteboard.eraserSize" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
  </tool-window>
</template>

<style scoped>

</style>
