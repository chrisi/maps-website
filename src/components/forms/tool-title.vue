<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<template>
  <h4 class="title center">{{ text }}</h4>
</template>

<style scoped>
.center {
  text-align: center;
}

.title {
  margin: 0;
  font-weight: bold;
}
</style>
