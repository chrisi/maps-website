<script setup lang="ts">
withDefaults(defineProps<{
  id: string
  name: string
  label: string
  width?: string
}>(), {
  width: '100%'
})
</script>

<template>
  <div class="row">
    <div class="label">
      <label :for="id">{{ label }}</label>
    </div>
    <div class="control">
      <select :id="id" :name="name" :style="{ width: width }">
        <slot/>
      </select>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
