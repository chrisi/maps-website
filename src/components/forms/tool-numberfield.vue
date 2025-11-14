<script setup lang="ts">
withDefaults(defineProps<{
  id: string
  name: string
  label: string
  value?: string
  min?: number
  max?: number
  step?: number
  width?: string
}>(), {
  width: '96%',
})

const emit = defineEmits<{
  (e: 'change', sender: string, value: string): void,
  (e: 'blur', sender: string, value: string): void
}>()

</script>

<template>
  <div class="row">
    <div class="label">
      <label :for="id">{{ label }}</label>
    </div>
    <div class="control">
      <input type="number" :id="id" :name="name" :style="{ width: width }" :value="value"
             :min="min" :max="max" :step="step"
             @input="event => emit('change', id, (event.target as HTMLInputElement).value)"
             @blur="event => emit('blur', id, (event.target as HTMLInputElement).value)">
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
