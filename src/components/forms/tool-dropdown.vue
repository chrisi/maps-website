<script setup lang="ts">
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";
import {onMounted, ref} from "vue";

const props = withDefaults(defineProps<{
  id: string
  name?: string
  label: string
  options?: ValueCaptionPair[]
  modelValue?: string
  unit?: string
  width?: string
}>(), {
  width: '100%',
  options: () => []
})

const emit = defineEmits<{
  (e: 'change', sender: string, value: string): void
  (e: 'update:modelValue', value: string): void
}>()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newValue = target.value
  emit('change', props.id, newValue)
  emit('update:modelValue', newValue)
}

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
      <!-- Vue.js style two-way value binding if modelValue is set -->
      <template v-if="modelValue">
        <select :id="id" :name="name" :style="{ width: width }" :value="modelValue" @change="onChange">
          <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.caption }}</option>
          <slot/>
        </select>
      </template>
      <!-- classic one-way binding if modelValue is not set, selected value can only be aquired via @change -->
      <template v-else>
        <select :id="id" :name="name" :style="{ width: width }" @change="onChange">
          <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.caption }}</option>
          <slot/>
        </select>
      </template>
    </div>
    <div v-if="unit" class="control-unit">
      <span style="padding-left: 2px;">{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
