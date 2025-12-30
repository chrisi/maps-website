<script setup lang="ts">
defineProps<{
  caption: string;
  x: number;
  y: number;
}>();
</script>

<template>
  <div class="wrapper row">
    <div class="caption col-4">{{ caption }}</div>
    <div class="value col-4">{{ x.toFixed(2) }}</div>
    <div class="value col-4">{{ y.toFixed(2) }}</div>
  </div>
</template>

<style scoped>
@import "@/assets/grid.css";

div {
  font-size: 13px;
}

.wrapper {
  align-items: center;
}

.caption {
  font-weight: bold;
}

.value {
  font-family: 'JetBrains Mono', monospace;
  text-align: right;
}
</style>
