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
const lo = ref(false)
const sa1 = ref(false)
const sa2 = ref(false)

const emit = defineEmits(['close'])
</script>

<template>
  <template>
    <tool-window :visible="visible" @close="emit('close')">
      <tool-title text="Aircraft Position"/>
      <tool-section name="Ownship"/>
      <tool-checkbox id="lock" label="Lock to Aircraft" v-model="lo"/>
      <tool-section name="Other Aircraft"/>
      <tool-checkbox id="show_1" label="Show Maverick" v-model="sa1"/>
      <tool-checkbox id="show_2" label="Show Viper" v-model="sa2"/>
    </tool-window>
  </template>
</template>

<style scoped>

</style>
