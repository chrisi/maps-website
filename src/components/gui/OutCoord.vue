<script setup lang="ts">
withDefaults(defineProps<{
  caption: string;
  x: number;
  y: number;
  decimal?: number;
}>(), {decimal: 2});
</script>

<template>
  <div class="wrapper row">
    <div class="caption col-4">{{ caption }}</div>
    <div class="value col-4">{{ x.toFixed(decimal) }}</div>
    <div class="value col-4">{{ y.toFixed(decimal) }}</div>
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
