<script setup lang="ts">
import {onUnmounted, ref} from 'vue'
import {baseUrl} from "@/scripts/utils.ts";

const left = defineModel<number>('left', {default: 100})
const top = defineModel<number>('top', {default: 100})
const width = defineModel<number>('width', {default: 400})
const height = defineModel<number>('height', {default: 200})
const isDragging = ref(false)
const dragOffset = ref({x: 0, y: 0})
const isResizing = ref(false)
const resizeStart = ref({x: 0, y: 0, width: 0, height: 0})

defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'resize'])

function onMouseDown(e: MouseEvent) {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - left.value,
    y: e.clientY - top.value,
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    const maxX = window.innerWidth - width.value - 2
    const maxY = window.innerHeight - height.value - 2

    left.value = Math.min(Math.max(0, e.clientX - dragOffset.value.x), maxX)
    top.value = Math.min(Math.max(0, e.clientY - dragOffset.value.y), maxY)
  }
}

function onMouseUp() {
  isDragging.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

function onResizeMouseDown(e: MouseEvent) {
  isResizing.value = true
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: width.value,
    height: height.value,
  }

  window.addEventListener('mousemove', onResizeMouseMove)
  window.addEventListener('mouseup', onResizeMouseUp)
  e.stopPropagation()
}

function onResizeMouseMove(e: MouseEvent) {
  if (isResizing.value) {
    const maxWidth = window.innerWidth - left.value - 2
    const maxHeight = window.innerHeight - top.value - 2

    width.value = Math.min(Math.max(200, resizeStart.value.width + (e.clientX - resizeStart.value.x)), maxWidth)
    height.value = Math.min(Math.max(100, resizeStart.value.height + (e.clientY - resizeStart.value.y)), maxHeight)
    emit('resize')
  }
}

function onResizeMouseUp() {
  isResizing.value = false
  window.removeEventListener('mousemove', onResizeMouseMove)
  window.removeEventListener('mouseup', onResizeMouseUp)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mousemove', onResizeMouseMove)
  window.removeEventListener('mouseup', onResizeMouseUp)
})
</script>

<template>
  <div v-if="visible" ref="windowRef" class="draggable-window"
       :style="{ left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px' }">
    <div ref="titlebarRef" class="titlebar" @mousedown="onMouseDown">
      <div class="title">{{ title }}</div>
      <div class="controls">
        <img :src="`${baseUrl}icons/buttons/close.png`" alt="Close" class="control" @click="emit('close')"/>
      </div>
    </div>
    <div class="content">
      <slot/>
    </div>
    <div class="resize-handle" @mousedown="onResizeMouseDown"></div>
  </div>
</template>

<style scoped>
.draggable-window {
  position: absolute;
  left: 80%;
  top: 50%;
  min-width: 200px;
  min-height: 100px;
  background-color: #98A8A8;
  border-radius: 12px;
  box-shadow: 6px 6px 12px #444;
  border: 1px solid #000;
  border-top: 1px solid #888;
  display: flex;
  flex-direction: column;
  user-select: none;
  z-index: 1000;
}

@font-face {
  font-family: 'Lexend Tera';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/lexendtera/v29/RrQUbo98_jt_IXnBPwCWtahHT4I.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

.titlebar {
  background: linear-gradient(to top, #000, #111, #888);
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  cursor: grab;
  font-family: "Lexend Tera", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
  font-weight: lighter;
}

.titlebar:active {
  cursor: grabbing;
}

.title {
  font-weight: bold;
  font-size: 14px;
  color: #eee;
}

.control {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.controls {
  display: flex;
  gap: 8px;
}

.content {
  padding: 10px;
  color: #444;
  flex: 1;
  overflow: auto;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #555 50%, #555 60%, transparent 60%, transparent 70%, #555 70%, #555 80%, transparent 80%);
  border-bottom-right-radius: 12px;
}
</style>
