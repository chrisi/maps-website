<script setup lang="ts">
import {onMounted, ref} from "vue";

const props = withDefaults(defineProps<{
  id: string
  name?: string
  label: string
  value: string | number
  unit?: string
  width?: string
  variant?: string
}>(), {
  width: '96%',
  variant: 'a'
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
    <div :class="`label-${variant}`">
      <label :for="id" ref="labelRef">{{ label }}</label>
    </div>
    <div :class="`control-${variant}`">
      <div :class="`control-value${unit ? '-with-unit' : ''}`">
        <div class="output" :style="{ width: width }">{{ value }}</div>
      </div>
      <div v-if="unit" class="control-unit">
        <span style="padding-left: 2px;">{{ unit }}</span>
      </div>
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
