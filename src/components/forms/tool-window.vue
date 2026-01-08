<script setup lang="ts">

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

</script>

<template>
  <div class="modal-backdrop" v-if="props.visible" @click="emit('close')">
    <div class="modal-content" @click.stop @mousedown.stop @mouseup.stop @wheel.stop @mousemove.stop>
      <slot/>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  pointer-events: none;
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(1, 1, 1, 0);
}

.modal-content {
  pointer-events: auto;
  position: fixed;
  left: 55px;
  top: 77px;
  background-color: rgba(245, 245, 245, 1);
  border: 1px solid black;
  box-shadow: 5px 5px 5px #222;
  padding: 8px;
  width: 240px;
}
</style>
