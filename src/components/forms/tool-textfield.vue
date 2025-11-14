<script setup lang="ts">
withDefaults(defineProps<{
  id: string
  name: string
  label: string
  value?: string
  width?: string
}>(), {
  width: '96%'
})

const emit = defineEmits(['change'])

</script>

<template>
  <div class="row">
    <div class="label">
      <label :for="id">{{ label }}</label>
    </div>
    <div class="control">
      <input type="text" :id="id" :name="name" :style="{ width: width }" :value="value" @change="emit('change')">
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>
