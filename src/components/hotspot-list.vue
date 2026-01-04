<script setup lang="ts">
import {useGlobalStore} from "@/stores/global.ts";

const global = useGlobalStore()
</script>

<template>
  <div v-if="global.hotspots.length > 0">
    <ul>
      <li v-for="(t,i) in global.hotspots" v-bind:key="i">{{ t.type }} {{ t.name }}</li>
    </ul>
  </div>
</template>

<style scoped>
div {
  width: 250px;
  margin: 15px;
  position: fixed;
  bottom: 0;
  left: 240px;

  pointer-events: none;
  font-family: JetBrains Mono, monospace;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.6);
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

div ul {
  list-style: none;
  padding: 0;
  margin: 1px;
}
</style>
