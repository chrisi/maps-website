<script setup lang="ts">

import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTitle from "@/components/forms/tool-title.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import ToolCheckbox from "@/components/forms/tool-checkbox.vue";
import {ref} from "vue";

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})
const lo = ref(true)
const sa1 = ref(false)
const sa2 = ref(false)
const sa3 = ref(false)

const emit = defineEmits(['close'])
</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-title text="Aircraft Position"/>
    <tool-section name="Ownship"/>
    <tool-checkbox id="lock" label="Follow Aircraft" v-model="lo"/>
    <tool-section name="Other Aircraft"/>
    <div class="checkbox-grid">
      <tool-checkbox id="show_1" label="Maverick" v-model="sa1"/>
      <tool-checkbox id="show_2" label="Viper" v-model="sa2"/>
      <tool-checkbox id="show_3" label="Tech" v-model="sa3"/>
    </div>
  </tool-window>
</template>

<style scoped>
.checkbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
