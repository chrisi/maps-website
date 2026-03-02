<script setup lang="ts">
import {baseUrl} from "@/scripts/utils.ts";

defineProps<{
  id: string
  text?: string
  icon?: string
  active?: boolean
  tooltip?: string
}>()

const emit = defineEmits<{
  (e: 'click', sender: string): void
}>()

</script>

<template>
  <template v-if="icon && !text">
    <button :title="tooltip"><img :id="id" :src="`${baseUrl}${icon}`" width="32" height="32" :alt="id" :class="{ active }" @click="emit('click',id)"></button>
  </template>
  <template v-if="text && !icon">
    <button :id="id" :title="tooltip" @click="emit('click',id)">{{ text }}</button>
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
