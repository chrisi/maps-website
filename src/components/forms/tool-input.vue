<script setup lang="ts">
const props = withDefaults(defineProps<{
  for: string
  label: string
  variant?: string
}>(), {
  variant: 'a'
})
</script>

<template>
  <div class="row">
    <div :class="`label-${variant}`">
      <label :for="props.for">{{ label }}</label>
    </div>
    <div :class="`control-${variant}`">
      <slot/>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
