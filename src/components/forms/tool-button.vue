<script setup lang="ts">
defineProps<{
  id: string
  text?: string
  icon?: string
}>()

const emit = defineEmits<{
  (e: 'click', sender: string): void
}>()

</script>

<template>
  <template v-if="icon || !text">
    <button><img :id="id" :src="icon" width="32" height="32" :alt="id" @click="emit('click',id)"></button>
  </template>
  <template v-if="text || !icon">
    <button :id="id" @click="emit('click',id)">{{ text }}</button>
  </template>
</template>

<style scoped>
button {
  margin: 4px;
}
</style>
