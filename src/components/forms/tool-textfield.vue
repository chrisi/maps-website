<script setup lang="ts">
import {nextTick, onMounted, ref} from "vue";

const props = withDefaults(defineProps<{
  id: string
  name?: string
  label: string
  value?: string
  unit?: string
  width?: string
  regexp?: RegExp
  variant?: string
}>(), {
  width: '96%',
  variant: 'a'
})

const emit = defineEmits<{
  (e: 'change', sender: string, value: string): void,
  (e: 'blur', sender: string, value: string): void
}>()

const hint = ref("")
const clazz = ref("control")
const inputRef = ref<HTMLInputElement | null>(null)
const labelRef = ref<HTMLLabelElement | null>(null)

onMounted(() => {
  if (props.unit) {
    clazz.value = "control-with-unit"
  }
})

const handleBlur = (event: FocusEvent) => {
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
        <input type="text" ref="inputRef" :id="id" :name="name" :style="{ width: width }" :value="value" @blur="handleBlur">
      </div>
      <div v-if="unit" class="control-unit">
        <span style="padding-left: 2px;">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
