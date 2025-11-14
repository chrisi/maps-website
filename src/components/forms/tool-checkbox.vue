<script setup lang="ts">
defineProps<{
  id: string
  name: string
  label: string
  checked?: boolean
}>()

const emit = defineEmits<{
  (e: 'change', sender: string, checked: boolean): void
}>()

</script>

<template>
  <div class="row">
    <div class="control">
      <input type="checkbox" :id="id" :name="name" :checked="checked"
             @change="event => emit('change', id, (event.target as HTMLInputElement).checked)">
    </div>
    <div class="label">
      <label :for="id">{{ label }}</label>
    </div>
  </div>
</template>


<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-block: 1px;
}

.control {
  flex: 0 0 auto;
  display: inline-flex;
  padding-right: 4px;
}

</style>
