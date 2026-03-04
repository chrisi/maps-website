<script setup lang="ts">
import {onUnmounted, ref} from 'vue'
import {baseUrl} from "@/scripts/utils.ts";

const position = ref({x: 100, y: 100})
const isDragging = ref(false)
const dragOffset = ref({x: 0, y: 0})

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

const emit = defineEmits(['close'])

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
  <div v-if="visible" ref="windowRef" class="draggable-window" :style="{ left: position.x + 'px', top: position.y + 'px' }">
    <div ref="titlebarRef" class="titlebar" @mousedown="onMouseDown">
      <div class="title">{{ title }}</div>
      <div class="controls">
        <img :src="`${baseUrl}/common/icons/close.png`" alt="Close" class="control" @click="emit('close')"/>
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
  left: 80%;
  top: 50%;
  //transform: translate(-50%, -50%);
  min-width: 400px;
  min-height: 200px;
  background-color: #98A8A8;
  border-radius: 12px;
  //box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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
  padding: 14px;
  color: #444;
  //line-height: 1.5;
}
</style>
