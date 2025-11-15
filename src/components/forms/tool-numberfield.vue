<script setup lang="ts">
import {onMounted, ref} from "vue";

const props = withDefaults(defineProps<{
  id: string
  name?: string
  label: string
  value?: string | number
  unit?: string
  min?: number
  max?: number
  step?: number
  width?: string
  variant?: string
}>(), {
  width: '96%',
  variant: 'a'
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
    <div :class="`label-${variant}`">
      <label :for="id">{{ label }}</label>
    </div>
    <div :class="`control-${variant}`">
      <div :class="`control-value${unit ? '-with-unit' : ''}`">
      <input type="number" :id="id" :name="name" :style="{ width: width }" :value="value"
             :min="min" :max="max" :step="step"
             @input="event => emit('change', id, (event.target as HTMLInputElement).value)"
             @blur="event => emit('blur', id, (event.target as HTMLInputElement).value)">
      </div>
      <div class="control-unit" v-if="unit">
        <span style="padding-left: 2px;">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
