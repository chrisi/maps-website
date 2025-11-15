<script setup lang="ts">

import ToolWindow from "@/components/forms/tool-window.vue";

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
  </tool-window>
</template>

<style scoped>

</style>
