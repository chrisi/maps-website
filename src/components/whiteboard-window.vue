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

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const colors: ValueCaptionPair[] = ([
  {caption: 'Black', value: '#000'},
  {caption: 'White', value: '#fff'},
  {caption: 'Red', value: '#ff4d4d'},
  {caption: 'Green', value: '#4caf50'},
  {caption: 'Blue', value: '#2196f3'},
  {caption: 'Yellow', value: '#ffeb3b'},
  {caption: 'Purple', value: '#9c27b0'},
]);

const emit = defineEmits(['close'])

interface DrawConfig {
  lineStyle: string;
  lineColor: string;
  lineThickness: number;
  fillStyle: string;
  fillColor: string;
  opacity: number;
  eraserSize: number;
}

const cfg = reactive<DrawConfig>({
  lineStyle: "0",
  lineColor: "#ff4d4d",
  lineThickness: 2,
  fillStyle: "0",
  fillColor: "#000",
  opacity: 30,
  eraserSize: 10,
});

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
          <pure-dropdown id="line-style" v-model="cfg.lineStyle" style="width: 100%;">
            <option value="0">Solid</option>
            <option value="1">Dashed</option>
            <option value="2">Dotted</option>
          </pure-dropdown>
        </div>
        <div style="flex: 4">
          <color-picker id="line-color" :colors="colors" v-model="cfg.lineColor"/>
        </div>
        <div style="flex: 2">
          <pure-numberfield id="thickness" v-model="cfg.lineThickness" :min="1" :max="10" :step="1"/>
        </div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Fill" for="fill-style">
      <div style="display: flex; width: 97%; gap: 4px;">
        <div style="flex: 5">
          <pure-dropdown id="fill-style" v-model="cfg.fillStyle">
            <option value="0">None</option>
            <option value="1">Solid</option>
          </pure-dropdown>
        </div>
        <div style="flex: 4">
          <color-picker id="fill-color" :colors="colors" v-model="cfg.fillColor"/>
        </div>
        <div style="flex: 2"></div>
      </div>
    </tool-input>
    <tool-input :variant="variant" label="Opacity" for="opacity">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 10">
          <range-slider id="opacity" v-model="cfg.opacity"/>
        </div>
        <div style="flex: 2">
          <input :value="cfg.opacity" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
    <tool-spacer/>
    <tool-section name="Eraser"/>
    <tool-input :variant="variant" label="Size" for="eraser-size">
      <div style="display: flex; width: 95%; gap: 8px;">
        <div style="flex: 10">
          <range-slider id="eraser-size" v-model="cfg.eraserSize"/>
        </div>
        <div style="flex: 2">
          <input :value="cfg.eraserSize" style="width: 100%" readonly/>
        </div>
      </div>
    </tool-input>
  </tool-window>
</template>

<style scoped>

</style>
