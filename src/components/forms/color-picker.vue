<script setup lang="ts">

withDefaults(defineProps<{
  id?: string
  name?: string
  modelValue: string
  width?: string
  showCaptions?: boolean
}>(), {
  width: '100%',
  showCaptions: false
})

const emit = defineEmits(['update:modelValue'])

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :id="id"
    :name="name"
    class="color-input"
    type="color"
    :value="modelValue"
    :style="{ width: width }"
    @input="onChange"
    @change="onChange"
  />
</template>

<style scoped>
.color-input {
  padding: 0;
  height: 22px;
  border: 1px solid rgb(118, 118, 118);
  border-radius: 3px;
  background: transparent;
  overflow: hidden;
}
</style>
