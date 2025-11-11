<script setup lang="ts">

interface Tool {
  name: string
  caption: string
  icon: string
}

const tools: Tool[] = [
  {name: "move", caption: "move", icon: "icon_move1.png"},
  {name: "zoom1", caption: "Zoom-Out", icon: "icon_zoom1.png"},
  {name: "zoom2", caption: "Zoom-In", icon: "icon_zoom2.png"},
  {name: "bullseye", caption: "Bullseye", icon: "icon_bullseye.png"},
  {name: "compass", caption: "Compass", icon: "icon_compass.png"},
  {name: "ruler", caption: "Ruler", icon: "icon_ruler.png"},
  {name: "symbol", caption: "Symbol", icon: "icon_sword.png"},
  {name: "pencil", caption: "Pencil", icon: "icon_pencil.png"},
  {name: "text", caption: "Text", icon: "icon_text.png"},
  {name: "eraser", caption: "Eraser", icon: "icon_eraser.png"},
  {name: "settings", caption: "Settings", icon: "icon_menu.png"},
]

const emit = defineEmits(['toolClick'])

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
        <img :src="'/common/assets/'+tool.icon"
             :alt="tool.caption" :id="tool.name"
             class="toolButton" @click="emit('toolClick', tool.name)">
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
}
</style>
