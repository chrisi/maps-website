<script setup lang="ts">
import {nextTick, ref} from "vue";

const props = withDefaults(defineProps<{
  id: string
  name?: string
  label: string
  modelValue?: string
  unit?: string
  width?: string
  regexp?: RegExp
  variant?: string
}>(), {
  width: '96%',
  variant: 'a'
})

const emit = defineEmits<{
  (e: 'blur', sender: string, value: string): void
  (e: 'update:modelValue', value: string): void
}>()

const hint = ref("")
const inputRef = ref<HTMLInputElement | null>(null)
const labelRef = ref<HTMLLabelElement | null>(null)

const onBlur = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement | null
  const value = target?.value ?? ""
  emit('blur', props.id, value)
  if (props.regexp) {
    if (value !== "" && !props.regexp.test(value)) {
      nextTick(() => {
        hint.value = "invalid value. must match " + props.regexp
        labelRef.value!.style.color = "red"
        inputRef.value!.focus()
        inputRef.value!.select()
      })
    } else {
      nextTick(() => {
        labelRef.value!.style.color = "black"
      })
    }
  }
}
</script>

<template>
  <div class="row">
    <div :class="`label-${variant}`">
      <label :for="id" ref="labelRef" :title="hint">{{ label }}</label>
    </div>
    <div :class="`control-${variant}`">
      <div :class="`control-value${unit ? '-with-unit' : ''}`">
        <input type="text" ref="inputRef" :id="id" :name="name" :style="{ width: width }" class="suspend-prevent" :value="modelValue"
               @input="event => emit('update:modelValue', (event.target as HTMLInputElement).value)" @blur="onBlur">
      </div>
      <div v-if="unit" class="control-unit">
        <span style="padding-left: 2px;">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
