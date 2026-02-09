<script setup lang="ts">
import {nextTick} from "vue";

const props = withDefaults(defineProps<{
  id?: string
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

const onBlur = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement | null
  const value = target?.value ?? ""
  emit('blur', props.id ?? "", value)
}

</script>

<template>

  <input type="number" :id="id" :name="name" :style="{ width: width }" class="suspend-prevent"
         :value="modelValue" :min="min" :max="max" :step="step"
         @input="event => emit('update:modelValue', (event.target as HTMLInputElement).value)" @blur="onBlur">
</template>

<style scoped src="@/components/forms/forms.css"/>
