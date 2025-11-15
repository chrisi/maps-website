<script setup lang="ts">

import {ref} from "vue";

interface Tool {
  name: string
  caption: string
  desc?: string
  activeIcon: string
  icons?: string[]
}

const tools = ref<Tool[]>([
  {
    name: "move", caption: "Move", activeIcon: "icon_move.png", icons: ["icon_move.png", "icon_move1.png"],
    desc: "Move the map view around the map."
  },
  {
    name: "zoom1", caption: "Zoom-Out", activeIcon: "icon_zoom1.png",
    desc: "Zoom out of the map view."
  },
  {
    name: "zoom2", caption: "Zoom-In", activeIcon: "icon_zoom2.png",
    desc: "Zoom in to the map view."
  },
  {
    name: "bullseye", caption: "Bullseye", activeIcon: "icon_bullseye.png", icons: ["icon_bullseye.png", "icon_bullseye1.png"],
    desc: "Set the bullseye point on the map."
  },
  {
    name: "route", caption: "Route", activeIcon: "icon_compass.png",
    desc: "Draw the mission route on the map."
  },
  {
    name: "ruler", caption: "Ruler", activeIcon: "icon_ruler.png", icons: ["icon_ruler.png", "icon_ruler1.png"],
    desc: "Measure distances on the map."
  },
  {
    name: "symbol", caption: "Symbol", activeIcon: "icon_sword.png", icons: ["icon_sword.png", "icon_sword1.png"],
    desc: "Draw symbols on the map."
  },
  {
    name: "pencil", caption: "Pencil", activeIcon: "icon_pencil.png", icons: ["icon_pencil.png", "icon_pencil1.png"],
    desc: "Draw lines on the map."
  },
  {
    name: "text", caption: "Text", activeIcon: "icon_text.png", icons: ["icon_text.png", "icon_text1.png"],
    desc: "Write text on the map."
  },
  {
    name: "eraser", caption: "Eraser", activeIcon: "icon_eraser.png", icons: ["icon_eraser.png", "icon_eraser1.png"],
    desc: "Erase symbols and texts from the map."
  },
  {
    name: "settings", caption: "Settings", activeIcon: "icon_menu.png",
    desc: "Change the map view settings."
  },
])

const emit = defineEmits(['toolClick'])

const resetTools = () => {
  tools.value.filter(tool => tool.icons).forEach(tool => {
    tool.activeIcon = tool.icons![0]!
  })
}

const clickTool = (tool: Tool) => {
  resetTools()
  if (tool.icons) {
    tool.activeIcon = tool.icons[1]!
  }
  emit('toolClick', tool.name)
}

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
        <img :src="'common/assets/'+tool.activeIcon" :id="tool.name" :alt="tool.caption" :title="tool.desc"
             class="toolButton" @click="clickTool(tool)">
      </td>
    </tr>
    </tbody>
  </table>
</template>

<style scoped>
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
