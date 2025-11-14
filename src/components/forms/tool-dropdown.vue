<script setup lang="ts">
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";

withDefaults(defineProps<{
  id: string
  name: string
  label: string
  options?: ValueCaptionPair[]
  width?: string
}>(), {
  width: '100%'
})

const emit = defineEmits(['change'])
</script>

<template>
  <div class="row">
    <div class="label">
      <label :for="id">{{ label }}</label>
    </div>
    <div class="control">
      <select :id="id" :name="name" :style="{ width: width }">
        <option v-if="options" v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.caption }}</option>
        <slot/>
      </select>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
