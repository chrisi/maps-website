<script setup lang="ts">
import {onMounted, ref} from "vue";

const props = withDefaults(defineProps<{
  size?: number
  medium?: boolean
  large?: boolean
}>(), {
  size: 4
})

const actualSize = ref("0px")

onMounted(() => {
  actualSize.value = props.size + "px"
  if (props.medium) {
    actualSize.value = "8px"
  }
  if (props.large) {
    actualSize.value = "16px"
  }
})
</script>
<template>
  <div :style="{paddingBlock: actualSize}"></div>
</template>


