<script setup lang="ts">

import {ref, watch} from "vue";
import type {OverlayMode} from "@/model/mode.ts";
import {useSettingsStore} from "@/stores/settings.ts";
import {storeToRefs} from "pinia";

const baseUrl = import.meta.env.BASE_URL

const props = defineProps<{
  modelValue: OverlayMode
}>()

const emit = defineEmits<{
  (e: 'toolClick', value: string): void
  (e: 'update:modelValue', value: string): void
}>()

interface Tool {
  name: string
  caption: string
  desc?: string
  activeIcon: string
  icons?: string[]
  show: () => boolean
}

const {viz} = storeToRefs(useSettingsStore())

const tools: Tool[] = ([
  {
    name: "locate", caption: "Locate", activeIcon: "icon_zoom.png", icons: ["icon_zoom.png", "icon_zoom.png"],
    desc: "Locate stations on the map.", show: () => viz.value.st
  },
  {
    name: "move", caption: "Move", activeIcon: "icon_move.png", icons: ["icon_move.png", "icon_move1.png"],
    desc: "Move the map view around the map.", show: () => true
  },
  {
    name: "measure", caption: "Measure", activeIcon: "icon_ruler.png", icons: ["icon_ruler.png", "icon_ruler1.png"],
    desc: "Measure distances on the map.", show: () => true
  },
  {
    name: "bullseye", caption: "Bullseye", activeIcon: "icon_bullseye.png", icons: ["icon_bullseye.png", "icon_bullseye1.png"],
    desc: "Set the bullseye point on the map.", show: () => viz.value.be
  },
  {
    name: "whiteboard", caption: "Whiteboard", activeIcon: "icon_pencil.png", icons: ["icon_pencil.png", "icon_pencil1.png"],
    desc: "Draw lines on the map.", show: () => viz.value.wb
  },
  {
    name: "route", caption: "Route", activeIcon: "icon_compass.png",
    desc: "Draw the mission route on the map.", show: () => viz.value.ms
  },
  {
    name: "settings", caption: "Settings", activeIcon: "icon_menu.png",
    desc: "Change the map view settings.", show: () => true
  },
])

watch(
  () => props.modelValue,
  (newVal) => {
    resetTools()
    activateTool(newVal)
  }
);

const resetTools = () => {
  tools.filter(tool => tool.icons).forEach(tool => {
    tool.activeIcon = tool.icons![0]!
  })
}

const activateTool = (name: string) => {
  const tool = tools.find(tool => tool.name == name)
  if (tool && tool.icons) {
    tool.activeIcon = tool.icons![1]!
  }
}

const collapsed = ref(false)

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

const clickTool = (tool: Tool) => {
  resetTools()
  if (tool.icons) {
    tool.activeIcon = tool.icons[1]!
  }
  emit('toolClick', tool.name)
  if (tool.icons) {
    // if icons are defined, the tool is a toggle button with an active state (mode)
    // switch the global mode using two-way data binding
    emit('update:modelValue', tool.name)
  }
}
//TODO: emit mouseup on toolbar enter
</script>

<template>
  <div class="toolbar-wrapper">
    <div class="toolbar-toggle" @click="toggleCollapsed">
      <img src="/common/assets/icon_toolbar.png" class="toolbar-header" alt="">
    </div>
    <transition name="list">
      <div v-show="!collapsed" class="toolbar-content">
        <div v-for="tool in tools.filter(t => t.show && t.show())" :key="tool.name">
          <img :src="`${baseUrl}/common/assets/${tool.activeIcon}`" :id="tool.name" :alt="tool.caption" :title="tool.desc"
               class="tool-button" @click.stop="clickTool(tool)">
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>

.toolbar-wrapper {
  display: inline-flex;
  flex-direction: column;
  pointer-events: auto;
  touch-action: none;
  border: 1px solid #555;
  box-shadow: 2px 2px 5px #555;
  background-color: white;
}

.toolbar-toggle {
  cursor: pointer;
  display: flex;
  width: 32px;
  height: 8px;
  justify-content: center;
}

.toolbar-content {
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Important for height transitions */
}

.toolbar-header {
  width: 32px;
  height: 8px;
  display: block;
}

.tool-button {
  width: 32px;
  height: 32px;
  display: block;
  cursor: pointer;
  pointer-events: auto;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
  max-height: 500px; /* Sufficiently large value */
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
