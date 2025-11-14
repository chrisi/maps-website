<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <h4>{{ name }}</h4>
  <hr>
</template>

<style scoped>
h4 {
  margin: 12px 0 0;
  font-family: sans-serif;
  font-weight: bold;
}

hr {
  margin: 4px 0;
}
</style>
