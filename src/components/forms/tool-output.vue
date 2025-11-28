<script setup lang="ts">
import {type CSSProperties} from "vue";

withDefaults(defineProps<{
  id?: string
  name?: string
  label: string
  value: string | number
  unit?: string
  width?: string
  variant?: string
  align?: string
}>(), {
  width: '96%',
  variant: 'a',
  align: 'left'
})
</script>

<template>
  <div class="row">
    <div :class="`label-${variant}`">
      <label :for="id" ref="labelRef">{{ label }}</label>
    </div>
    <div :class="`control-${variant}`">
      <div :class="`control-value${unit ? '-with-unit' : ''}`">
        <div class="output" :style="{ width: width, textAlign: align } as CSSProperties">{{ value }}</div>
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
  padding-inline: 4px;
  font-weight: bold;
}
</style>
