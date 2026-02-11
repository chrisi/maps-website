<script setup lang="ts">
defineProps<{
  caption: string;
  val: number | string;
}>();
</script>

<template>
  <div class="wrapper row">
    <div class="caption col-5">{{ caption }}</div>
    <div class="value col-7">{{ typeof val === 'number' ? val.toFixed(2) : val }}</div>
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
