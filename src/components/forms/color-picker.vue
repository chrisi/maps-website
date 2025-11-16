<script setup lang="ts">
import {onMounted, ref} from "vue";
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";

const props = withDefaults(defineProps<{
  id: string
  name?: string
  colors: ValueCaptionPair[]
  modelValue: string
  width?: string
  showCaptions?: boolean
}>(), {
  width: '100%',
  showCaptions: false
})

const refSelect = ref<HTMLSelectElement | null>(null);
const emit = defineEmits(['update:modelValue'])


function getTextColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? '#000000' : '#ffffff';
}

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const val = target.value
  target.style.backgroundColor = val
  target.style.color = getTextColor(val)
  emit('update:modelValue', val)
}

onMounted(() => {
  refSelect.value!.style.backgroundColor = props.modelValue
  refSelect.value!.style.color = getTextColor(props.modelValue)
})

</script>

<template>
  <select ref="refSelect" :id="id" :style="{ width: width }" :value="modelValue" class="color-select" @change="onChange">
    <option v-for="color in colors" :key="color.value" :value="color.value"
            :style="{ backgroundColor: color.value, color: getTextColor(color.value) }">
      {{ showCaptions ? color.caption : '&nbsp;' }}
    </option>
  </select>
</template>

<style scoped>
.color-select {
  padding: 1px;
  border: 1px solid rgb(118, 118, 118);
  border-radius: 3px;
  overflow: hidden;
}
</style>
