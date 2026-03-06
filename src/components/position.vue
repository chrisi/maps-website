<script setup lang="ts">
import {ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useGlobalStore} from "@/stores/global.ts";
import type {Point} from "@/model/base.ts";
import {strLatLong} from "@/scripts/conv.ts";
import {feetToLatLong} from "@/scripts/math.ts";

const {map} = storeToRefs(useGlobalStore())
const coords = ref("N00°00.000', E00°00.000'")

const props = defineProps<{
  pos: Point
}>()

watch(() => props.pos, (newPos) => {
  const feet = {x: newPos.x * map.value!.resolution, y: (map.value!.pixels - newPos.y) * map.value!.resolution}
  const strCrd = strLatLong(feetToLatLong(map.value!.projection, feet));
  coords.value = `${strCrd.lat}, ${strCrd.long}`
})

</script>

<template>
  <div id="position">{{ coords }}</div>
</template>

<style scoped>

#position {
  pointer-events: none;
  position: fixed;
  top: 0;
  right: 0;
  margin: 15px;
  font-family: JetBrains Mono, monospace;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.6);
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

</style>
