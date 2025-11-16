<script setup lang="ts">
withDefaults(defineProps<{
  id: string
  name?: string
  modelValue?: string | number
  min?: number
  max?: number
  step?: number
  width?: string
}>(), {
  width: '96%'
})

const emit = defineEmits<{
  (e: 'blur', sender: string, value: string): void
  (e: 'update:modelValue', value: string | number): void
}>()
</script>

<template>

  <input type="number" :id="id" :name="name" :style="{ width: width }" :value="modelValue"
         :min="min" :max="max" :step="step"
         @input="event => emit('update:modelValue', (event.target as HTMLInputElement).value)"
         @blur="event => emit('blur', id, (event.target as HTMLInputElement).value)">
</template>

<style scoped src="@/components/forms/forms.css"/>
