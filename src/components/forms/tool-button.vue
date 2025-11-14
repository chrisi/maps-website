<script setup lang="ts">
defineProps<{
  id: string
  icon: string
}>()

const emit = defineEmits(['click'])

</script>

<template>
  <button><img :id="id" :src="icon" width="32" height="32" :alt="id" @click="emit('click')"></button>
</template>

<style scoped>
button {
  margin: 4px;
}
</style>
