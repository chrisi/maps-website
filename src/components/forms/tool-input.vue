<script setup lang="ts">
const props = defineProps<{
  for: string
  label: string
}>()
</script>

<template>
  <div class="row">
    <div class="label">
      <label :for="props.for">{{ label }}</label>
    </div>
    <div class="control">
      <slot/>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
