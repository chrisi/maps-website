<script setup lang="ts">
import {onMounted, ref} from "vue";

const props = withDefaults(defineProps<{
  id: string
  name?: string
  label: string
  value: string
  unit?: string
  width?: string
}>(), {
  width: '96%'
})

const clazz = ref("control")

onMounted(() => {
  if (props.unit) {
    clazz.value = "control-with-unit"
  }
})

</script>

<template>
  <div class="row">
    <div class="label">
      <label :for="id" ref="labelRef">{{ label }}</label>
    </div>
    <div :class="clazz">
      <div class="output" :style="{ width: width }">{{ value }}</div>
    </div>
    <div v-if="unit" class="control-unit">
      <span style="padding-left: 2px;">{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped src="@/components/forms/forms.css"/>

<style scoped>
.output {
  padding-inline: 10px;
  font-weight: bold;
}
</style>
