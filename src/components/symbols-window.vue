<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";
// import ToolWindow from "@/components/forms/tool-window.vue";
import ToolDropdown from "@/components/forms/tool-dropdown.vue";
import ToolTitle from "@/components/forms/tool-title.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import {useGlobalStore} from "@/stores/global.ts";

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const global = useGlobalStore();

// const emit = defineEmits(['close'])

const idents: ValueCaptionPair[] = [
  {value: "1006", caption: "Hostile"},
  {value: "1003", caption: "Friend"},
]

const types: ValueCaptionPair[] = [
  {value: "100016", caption: "Land Unit"},
  {value: "010000", caption: "Air"},
  {value: "300000", caption: "Sea Surface"},
]

const entityMap: Record<string, ValueCaptionPair[]> = {
  "100016": [
    {value: "1211000000", caption: "Infantry"},
    {value: "1301000000", caption: "Air Defense"},
    {value: "1211020000", caption: "Mechanized"},
    {value: "1211040000", caption: "Motorized"},
    {value: "1205000000", caption: "Armored"},
    {value: "1407000000", caption: "Engineer"},
    {value: "1303000000", caption: "Field Artillery"},
    {value: "1303010000", caption: "Propelled Artillery"},
    {value: "1634000000", caption: "Supply"},
  ],
  "010000": [
    {value: "1101020000", caption: "Attack"},
    {value: "1101030000", caption: "Bomber"},
    {value: "1101040000", caption: "Fighter"},
    {value: "1101050000", caption: "Fighter/Bomber"},
    {value: "1101070000", caption: "Cargo"},
    {value: "1101080000", caption: "Jammer"},
    {value: "1101090000", caption: "Tanker"},
    {value: "1101110000", caption: "Reconnaisance"},
    {value: "1101160000", caption: "Airborne Early Warn."},
    {value: "1102000000", caption: "Rotary-Wing"},
  ],
  "300000": [
    {value: "1201000000", caption: "Carrier"},
    {value: "1202000000", caption: "Surface Combatant"},
    {value: "1401000000", caption: "Merchant Ship"},
  ]
}

const entities = ref<ValueCaptionPair[]>(entityMap["100016"]!);

const sec1: ValueCaptionPair[] = [
  {value: "00", caption: "Unspecified"},
  {value: "01", caption: "Airmobile"},
  {value: "10", caption: "Command and Control"},
  {value: "41", caption: "Multi Rocket Launcher"},
  {value: "50", caption: "Radar"},
]

const sidcDocUrl = "https://www.jcs.mil/Portals/36/Documents/Doctrine/Other_Pubs/ms_2525d.pdf"

const selectedEntity = ref("")
const selectedIdent = ref("1006")
const selectedType = ref("100016")

function genIconCode() {
  global.selectedSymbol = `${selectedIdent.value}${selectedType.value}${selectedEntity.value}`
}

watch(selectedIdent, () => {
  genIconCode()
})

watch(selectedType, (value) => {
  entities.value = entityMap[value]!
  selectedEntity.value = entities.value[0]!.value
  genIconCode()
})

watch(selectedEntity, () => {
  genIconCode()
})

onMounted(() => {
  selectedEntity.value = entities.value[0]!.value
  genIconCode()
})

</script>

<template>
<!--  <tool-window :visible="visible" @close="emit('close')">-->
    <tool-title text="C2 Symbols"/>
    <tool-section name="Symbol Set"/>
    <tool-dropdown label="Identity" v-model="selectedIdent" :options="idents"/>
    <tool-dropdown label="Type" v-model="selectedType" :options="types"/>
    <tool-section name="Identification"/>
    <tool-dropdown label="Entity" v-model="selectedEntity" :options="entities"/>
    <tool-dropdown label="Sector 1" :options="sec1"/>
    <tool-dropdown label="Sector 2">
      <option value="00">Unspecified</option>
    </tool-dropdown>
    <tool-section name="Symbol Identification Code"/>
    <tool-spacer/>
    <div class="symbol" v-if="global.selectedSymbol">
      <div>
        <img id="sidc-symbol" :src="`../common/assets/${global.selectedSymbol}.ico`" width="32" height="32" alt="symbol">
      </div>
      <div>{{ global.selectedSymbol }}</div>
    </div>
    <div style="text-align: center">
      <a :href="sidcDocUrl" style="font-size:70%" target="_blank">MIL-STD-2525D</a>
    </div>
<!--  </tool-window>-->
</template>

<style scoped>
.symbol {
  display: flex;
  align-items: center;
  width: 100%;
}

.symbol div:nth-child(1) {
  align-items: center;
  justify-content: center;
  width: 60px;
  display: flex;
}

.symbol div:nth-child(2) {
  justify-content: center;
  padding-inline: 4px;
  width: 100%;
}
</style>
