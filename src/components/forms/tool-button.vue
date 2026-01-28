<script setup lang="ts">
defineProps<{
  id: string
  text?: string
  icon?: string
  active?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', sender: string): void
}>()

const baseUrl = import.meta.env.BASE_URL

</script>

<template>
  <template v-if="icon && !text">
    <button><img :id="id" :src="`${baseUrl}${icon}`" width="32" height="32" :alt="id" :class="{ active }" @click="emit('click',id)"></button>
  </template>
  <template v-if="text && !icon">
    <button :id="id" @click="emit('click',id)">{{ text }}</button>
  </template>
</template>

<style scoped>
button {
  margin: 4px;
  padding: 2px;
  display: inline-block;
}
img {
  display: block;
}
img.active {
  background-color: lightgreen;
}
</style>
