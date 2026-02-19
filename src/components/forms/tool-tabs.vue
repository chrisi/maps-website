<script setup lang="ts">

import {onMounted, type PropType} from "vue";

const emit = defineEmits(['tab-changed'])

const props = defineProps({
  tabs: {
    type: Array as PropType<string[]>,
    required: true
  }
})

function openTab(tabName: string) {
  const tabcontent = document.getElementsByClassName("tabcontent") as HTMLCollectionOf<HTMLDivElement>;
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i]!.style.display = "none";
  }
  const tablinks = document.getElementsByClassName("tablinks") as HTMLCollectionOf<HTMLButtonElement>;
  for (let i = 0; i < tablinks.length; i++) {
    const tab = tablinks[i]!
    tab.className = tab.className.replace(" active", "");
    if (tab.name == tabName) tab.className += " active";
  }
  document.getElementById(tabName)!.style.display = "block";
  emit('tab-changed', tabName)
}

onMounted(() => {
  openTab(props.tabs[0]!)
})

</script>

<template>
  <div class="tab">
    <button v-for="t in tabs" v-bind:key="t" class="tablinks" :name="t" @click.stop="openTab(t)">{{ t }}</button>
  </div>
  <div v-for="t in tabs" v-bind:key="t" :id="t" class="tabcontent">
    <slot :name="t"/>
  </div>
</template>

<style scoped>
/* Style the tab */
.tab {
  overflow: hidden;
  padding: 0;
  margin: 0;
  border-style: none;
  background-color: #ccc;
}

/* Style the buttons inside the tab */
.tab button {
  background-color: inherit;
  float: left;
  border: 1px solid #ccc;
  border-bottom: none;
  /*outline: none; */
  cursor: pointer;
  padding: 4px 8px;
  transition: 0.3s;
  font-size: 15px;
}

/* Change background color of buttons on hover */
.tab button:hover {
  background-color: #ddd;
}

/* Create an active/current tablink class */
.tab button.active {
  background-color: rgba(245, 245, 245, 1);
}

/* Style the tab content */
.tabcontent {
  display: none;
  padding: 4px 0;
  border-style: none;
}

</style>
