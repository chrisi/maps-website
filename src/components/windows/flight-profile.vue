<script setup lang="ts">
import BmsWindow from "@/components/forms/bms-window.vue";

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'btnClick'])

</script>

<template>
  <bms-window title="Flight-Profile" :visible="visible" @close="emit('close')">
    <div class="profile"/>
  </bms-window>
</template>

<style scoped>
.profile {
  background-color: #4caf50;
  height: 100%;
}
</style>
