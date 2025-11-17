<script setup lang="ts">
withDefaults(defineProps<{
  id: string
  name?: string
  label: string
  modelValue?: string | number
  unit?: string
  min?: number
  max?: number
  step?: number
  width?: string
  variant?: string
}>(), {
  width: '96%',
  variant: 'a',
  min: 0,
  max: 100,
  step: 1
})

const emit = defineEmits<{
  (e: 'blur', sender: string, value: string): void
  (e: 'update:modelValue', value: string | number): void
}>()
</script>

<template>
  <div class="row">
    <div :class="`label-${variant}`">
      <label :for="id">{{ label }}</label>
    </div>
    <div :class="`control-${variant}`">
      <div :class="`control-value${unit ? '-with-unit' : ''}`">
        <input type="number" :id="id" :name="name" :style="{ width: width }" class="suspend-prevent"
               :value="modelValue" :min="min" :max="max" :step="step"
               @input="event => emit('update:modelValue', (event.target as HTMLInputElement).value)"
               @blur="event => emit('blur', id, (event.target as HTMLInputElement).value)">
      </div>
      <div class="control-unit" v-if="unit">
        <span style="padding-left: 2px;">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
