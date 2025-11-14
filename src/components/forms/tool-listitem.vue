<script setup lang="ts">
defineProps<{
  label: string
  value: string
}>()
</script>

<template>
  <div class="row" v-if="value">
    <div class="label">{{ label }}:</div>
    <div class="data">{{ value }}</div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  width: 100%;
}

.label {
  width: 35%;
  font-size: medium;
  font-family: monospace;
}

.data {
  width: 65%;
  font-size: medium;
  font-weight: bolder;
  font-family: monospace;
}
</style>
