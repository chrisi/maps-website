<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    spacer?: boolean
  }>(),
  {
    spacer: true,
  },
)
</script>

<template>
  <h4 :class="{ spacer }">{{ name }}</h4>
  <hr>
</template>

<style scoped>
h4 {
  margin: 0;
  font-family: sans-serif;
  font-weight: bold;
}

h4.spacer {
  margin-top: 12px;
}

hr {
  margin: 4px 0;
}
</style>
