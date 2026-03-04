<script setup lang="ts">
import {onUnmounted, ref} from 'vue'

const position = ref({x: 100, y: 100})
const isDragging = ref(false)
const dragOffset = ref({x: 0, y: 0})

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  }
})

function onMouseDown(e: MouseEvent) {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    position.value = {
      x: e.clientX - dragOffset.value.x,
      y: e.clientY - dragOffset.value.y,
    }
  }
}

function onMouseUp() {
  isDragging.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div
    ref="windowRef"
    class="draggable-window"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    <div
      ref="titlebarRef"
      class="titlebar"
      @mousedown="onMouseDown"
    >
      <div class="title">{{ title }}</div>
      <div class="controls">
        <div class="control close"></div>
      </div>
    </div>
    <div class="content">
      <slot/>
    </div>
  </div>
</template>

<style scoped>
.draggable-window {
  position: absolute;
  width: 400px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1px solid #ccc;
  dispslay: flex;
  flex-direction: column;
  user-select: none;
  z-index: 1000;
}

.titlebar {
  background: linear-gradient(to bottom, #ebebeb, #d1d1d1);
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  cursor: grab;
  border-bottom: 1px solid #bbb;
}

.titlebar:active {
  cursor: grabbing;
}

.title {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.controls {
  display: flex;
  gap: 8px;
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.close {
  background-color: #f00;
}

.content {
  padding: 10px;
  color: #444;
  //line-height: 1.5;
}
</style>
