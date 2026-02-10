<script setup lang="ts">

import {watch} from "vue";
import type {OverlayMode} from "@/model/mode.ts";

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
}

const tools: Tool[] = ([
  {
    name: "move", caption: "Move", activeIcon: "icon_move.png", icons: ["icon_move.png", "icon_move1.png"],
    desc: "Move the map view around the map."
  },
  // {
  //   name: "connect", caption: "Connect", activeIcon: "connect.png", icons: ["connect.png", "connect.png"],
  //   desc: "Quickly connect to collaboration server."
  // },
  // {
  //   name: "zoom1", caption: "Zoom-Out", activeIcon: "icon_zoom1.png",
  //   desc: "Zoom out of the map view."
  // },
  // {
  //   name: "zoom2", caption: "Zoom-In", activeIcon: "icon_zoom2.png",
  //   desc: "Zoom in to the map view."
  // },
  // {
  //   name: "non", caption: "Route", activeIcon: "route.png", icons: ["route.png", "route.png"],
  //   desc: "Center the Mission route on the map."
  // },
  {
    name: "measure", caption: "Measure", activeIcon: "icon_ruler.png", icons: ["icon_ruler.png", "icon_ruler1.png"],
    desc: "Measure distances on the map."
  },
  {
    name: "bullseye", caption: "Bullseye", activeIcon: "icon_bullseye.png", icons: ["icon_bullseye.png", "icon_bullseye1.png"],
    desc: "Set the bullseye point on the map."
  },
  // {
  //   name: "symbol", caption: "Symbol", activeIcon: "icon_sword.png", icons: ["icon_sword.png", "icon_sword1.png"],
  //   desc: "Draw symbols on the map."
  // },
  {
    name: "whiteboard", caption: "Whiteboard", activeIcon: "icon_pencil.png", icons: ["icon_pencil.png", "icon_pencil1.png"],
    desc: "Draw lines on the map."
  },
  {
    name: "route", caption: "Route", activeIcon: "icon_compass.png",
    desc: "Draw the mission route on the map."
  },
  // {
  //   name: "text", caption: "Text", activeIcon: "icon_text.png", icons: ["icon_text.png", "icon_text1.png"],
  //   desc: "Write text on the map."
  // },
  // {
  //   name: "eraser", caption: "Eraser", activeIcon: "icon_eraser.png", icons: ["icon_eraser.png", "icon_eraser1.png"],
  //   desc: "Erase symbols and texts from the map."
  // },
  {
    name: "settings", caption: "Settings", activeIcon: "icon_menu.png",
    desc: "Change the map view settings."
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
  <table class="pm0">
    <tbody>
    <tr>
      <td>
        <img src="/common/assets/icon_toolbar.png" class="toolBar" alt="">
      </td>
    </tr>
    <tr v-for="tool in tools" v-bind:key="tool.name">
      <td>
        <img :src="`${baseUrl}/common/assets/${tool.activeIcon}`" :id="tool.name" :alt="tool.caption" :title="tool.desc"
             class="toolButton" @click.stop="clickTool(tool)">
      </td>
    </tr>
    </tbody>
  </table>
</template>

<style scoped>

table {
  pointer-events: auto;
  touch-action: none;
}

.pm0 {
  padding: 0;
  margin: 0;
  border-spacing: 0;
}

.pm0 td {
  padding: 0;
}

.toolBar {
  width: 32px;
  height: 8px;
  display: block;
}

.toolButton {
  width: 32px;
  height: 32px;
  display: block;
  cursor: pointer;
  pointer-events: auto;
}
</style>
