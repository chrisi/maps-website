<script setup lang="ts">
import BmsWindow from "@/components/forms/bms-window.vue";
import {onUpdated, useTemplateRef} from "vue";

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'btnClick', 'resize'])

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')

function onResize() {
  if (canvasRef.value) {
    emit('resize', canvasRef.value)
  }
}

onUpdated(() => {
  onResize()
})

</script>

<template>
  <bms-window title="Flight-Profile" :visible="visible" @close="emit('close')" @resize="onResize">
    <div class="profile">
      <canvas ref="canvas" class="profile-canvas"/>
    </div>
  </bms-window>
</template>

<style scoped>
.profile {
  height: 100%;
  width: 100%;
}

.profile-canvas {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  display: block;
}
</style>
