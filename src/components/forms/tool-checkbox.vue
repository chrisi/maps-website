<script setup lang="ts">
const props = withDefaults(defineProps<{
    id: string
    name?: string
    label: string
    modelValue?: boolean
  }>(),
  {
    modelValue: false,
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', sender: string, checked: boolean): void
}>()

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  const checked = target.checked
  emit('update:modelValue', checked)
  emit('change', props.id, checked)
}
</script>

<template>
  <div class="row">
    <div class="control">
      <input type="checkbox" :id="id" :name="name" :checked="modelValue" @change="onChange">
    </div>
    <div>
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
