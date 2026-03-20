<script setup lang="ts">

import {onMounted, type PropType, ref, watch, nextTick} from "vue";

const emit = defineEmits(['tab-changed'])

const props = defineProps({
  tabs: {
    type: Array as PropType<string[]>,
    required: true
  },
  adaptive: {
    type: Boolean,
    default: false
  }
})

const currentTab = ref<string | null>(null)

function openTab(tabName: string) {
  currentTab.value = tabName
  emit('tab-changed', tabName)
}

watch(() => props.tabs, async (newTabs) => {
  if (currentTab.value && !newTabs.includes(currentTab.value)) {
    if (newTabs.length > 0) {
      await nextTick()
      openTab(newTabs[0]!)
    }
  }
}, {deep: true})

onMounted(() => {
  if (props.tabs.length > 0) {
    openTab(props.tabs[0]!)
  }
})

</script>

<template>
  <div :class="['tab', { 'adaptive-tab': adaptive }]">
    <button
        v-for="t in tabs"
        :key="t"
        :class="['tablinks', { active: currentTab === t }]"
        :name="t"
        @click.stop="openTab(t)"
    >
      {{ t }}
    </button>
  </div>
  <div v-if="adaptive" class="tab-dropdown">
    <select :value="currentTab" @change="openTab(($event.target as HTMLSelectElement).value)">
      <option v-for="t in tabs" :key="t" :value="t">{{ t }}</option>
    </select>
  </div>
  <div v-for="t in tabs" :key="t">
    <div v-show="currentTab === t" class="tabcontent">
      <slot :name="t"/>
    </div>
  </div>
</template>


<style scoped>
.tab {
  display: flex;
  align-items: flex-end;
  padding: 0;
  margin: 0;
  /*background-color: #ddd;*/
}

.tab::before {
  width: 6px;
  content: "";
  border-bottom: 1px solid #999;
}

.tab::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #999;
}

.tab-dropdown {
  display: none;
  padding: 8px;
  border-bottom: 1px solid #999;
}

.tab-dropdown select {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #aaa;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
}

@media screen and (max-width: 600px) {
  .adaptive-tab {
    display: none;
  }
  .tab-dropdown {
    display: block;
  }
}

.tab button {
  color: #777;
  background-color: #ccc;
  border: 1px solid #aaa;
  border-bottom: 1px solid #777;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  padding: 4px 8px;
  transition: 0.3s;
  font-size: 15px;
}

.tab button:hover {
  background-color: #ddd;
}

.tab button.active {
  color: #333;
  background-color: rgba(245, 245, 245, 1);
  border: 1px solid #777;
  border-bottom: 1px solid rgba(245, 245, 245, 1);
}
</style>
