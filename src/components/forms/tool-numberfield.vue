<script setup lang="ts">
import {onMounted, ref} from "vue";

const props = withDefaults(defineProps<{
  id: string
  name: string
  label: string
  value?: string
  unit?: string
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

const clazz = ref("control")

onMounted(() => {
  if (props.unit) {
    clazz.value = "control-with-unit"
  }
})

</script>

<template>
  <div class="row">
    <div class="label">
      <label :for="id">{{ label }}</label>
    </div>
    <div :class="clazz">
      <input type="number" :id="id" :name="name" :style="{ width: width }" :value="value"
             :min="min" :max="max" :step="step"
             @input="event => emit('change', id, (event.target as HTMLInputElement).value)"
             @blur="event => emit('blur', id, (event.target as HTMLInputElement).value)">
    </div>
    <div v-if="unit" class="control-unit">
      <span style="padding-left: 2px;">{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
