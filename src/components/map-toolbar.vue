<script setup lang="ts">

import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {useSettingsStore} from "@/stores/settings.ts";
import {storeToRefs} from "pinia";
import {baseUrl} from "@/scripts/utils.ts";

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
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

const collapsed = ref(false)

const activeTool = ref<Tool | undefined>(undefined)

const tools = ref<Tool[]>([
  {
    name: "locate", caption: "Locate", activeIcon: "icon_locate.png", icons: ["icon_locate.png", "icon_locate1.png"],
    desc: "Locate stations on the map.", show: () => viz.value.st
  },
  {
    name: "move", caption: "Move", activeIcon: "icon_move.png", icons: ["icon_move.png", "icon_move1.png"],
    desc: "Move the map view around the map.", show: () => false
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
    name: "route", caption: "Route", activeIcon: "icon_compass.png", icons: ["icon_compass.png", "icon_compass1.png"],
    desc: "Draw the mission route on the map.", show: () => viz.value.ms
  },
  {
    name: "aircraft", caption: "Aircraft", activeIcon: "icon_aircraft.png", icons: ["icon_aircraft.png", "icon_aircraft1.png"],
    desc: "Show aircraft position on the map.", show: () => viz.value.op
  },
  {
    name: "settings", caption: "Settings", activeIcon: "icon_settings.png", icons: ["icon_settings.png", "icon_settings1.png"],
    desc: "Change the map view settings.", show: () => true
  },
])

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

watch(
  () => props.modelValue,
  (newVal) => {
    findAndActivateTool(newVal)
  }
);

const headerIcon = computed(() => {
  const icon = collapsed.value ? "tb_expand.png" : "tb_collapse.png"
  return `${baseUrl}icons/toolbar/${icon}`
})

const findAndActivateTool = (name: string) => {
  const tool = tools.value.find(tool => tool.name == name)
  if (tool) activateTool(tool)
}

const activateTool = (tool: Tool) => {
  resetIcons()
  if (tool.icons) {
    tool.activeIcon = tool.icons![1]!
  }
  activeTool.value = tool
}
const clickTool = (tool: Tool) => {
  if (tool.name == activeTool.value?.name) {
    resetIcons()
    activeTool.value = undefined
    emit('update:modelValue', 'move')
  } else {
    emit('update:modelValue', tool.name)
  }
}

const resetIcons = () => {
  tools.value.filter(tool => tool.icons).forEach(tool => {
    tool.activeIcon = tool.icons![0]!
  })
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey) {
    switch (e.code) {
      case 'KeyF':
        emit('update:modelValue', 'locate')
        e.preventDefault()
        break;
      case 'Comma':
        emit('update:modelValue', 'settings')
        break;
    }
  } else {
    switch (e.key) {
      case '1':
      case 'm':
        emit('update:modelValue', 'measure')
        break
      case '2':
      case 'b':
        emit('update:modelValue', 'bullseye')
        break
      case '3':
      case 'w':
        emit('update:modelValue', 'whiteboard')
        break
      case '4':
      case 'r':
        emit('update:modelValue', 'route')
        break
      case '5':
      case 's':
        emit('update:modelValue', 'settings')
        break
      case 'Escape':
        emit('update:modelValue', 'move')
        break
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

//TODO: emit mouseup on toolbar enter
</script>

<template>
  <div class="toolbar-wrapper">
    <div class="toolbar-toggle" @click="toggleCollapsed">
      <img :src="headerIcon" class="toolbar-header" alt="">
    </div>
    <transition name="list">
      <div v-show="!collapsed" class="toolbar-content">
        <div v-for="tool in tools.filter(t => t.show && t.show())" :key="tool.name">
          <img :src="`${baseUrl}icons/toolbar/${tool.activeIcon}`" :id="tool.name" :alt="tool.caption" :title="tool.desc"
               class="tool-button" @click.stop="clickTool(tool)">
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>

.toolbar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  margin: 15px;
  display: inline-flex;
  flex-direction: column;
  pointer-events: auto;
  touch-action: none;
  border: 1px solid #555;
  box-shadow: 2px 2px 5px #555;
  background-color: white;
  z-index: 1 /* Sit on top */
}

.toolbar-toggle {
  cursor: pointer;
  display: flex;
  width: 32px;
  height: 16px;
  justify-content: center;
}

.toolbar-content {
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Important for height transitions */
}

.toolbar-header {
  width: 32px;
  height: 16px;
  background-color: #555;
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
