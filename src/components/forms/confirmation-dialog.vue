<script setup lang="ts">
import ToolTitle from "@/components/forms/tool-title.vue";
import ToolButton from "@/components/forms/tool-button.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";

defineProps<{
  visible: boolean
  message: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div v-if="visible" @close="emit('cancel')" class="confirmation-container">
    <tool-title :text="message"/>
    <tool-spacer/>
    <div style="display: flex; justify-content: space-around;">
      <tool-button id="confirm-yes" text="Yes" @click="emit('confirm')"/>
      <tool-button id="confirm-no" text="No" @click="emit('cancel')"/>
    </div>
  </div>
</template>

<style scoped>
.confirmation-container {
  position: fixed;
  background-color: rgba(245, 245, 245, 1);
  border: 1px solid black;
  box-shadow: 6px 6px 9px #444;
  padding: 8px;
  left: 330px;
  top: 200px;
  width: 240px;
  z-index: 100;
}
</style>
