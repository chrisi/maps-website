<script setup lang="ts">

withDefaults(defineProps<{
  id?: string
  name?: string
  modelValue: number
  min?: number
  max?: number
  step?: number
  width?: string
}>(), {
  width: '100%',
  min: 0,
  max: 100,
  step: 1,
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()
</script>

<template>
  <input type="range" :id="id" :name="name" :min="min" :max="max" :step="step" :style="{ width: width }" class="suspend-prevent"
         :value="modelValue"  @input="event => emit('update:modelValue', (event.target as HTMLInputElement).valueAsNumber)">
</template>

<style scoped>

</style>
