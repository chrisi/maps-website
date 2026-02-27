<script setup lang="ts">

import {computed, onMounted, reactive, ref} from "vue";
import type {ValueCaptionPair} from "@/components/forms/ValueCaptionPair.ts";
import ToolWindow from "@/components/forms/tool-window.vue";
import ToolTabs from "@/components/forms/tool-tabs.vue";
import ToolSpacer from "@/components/forms/tool-spacer.vue";
import ToolDropdown from "@/components/forms/tool-dropdown.vue";
import ToolNumberfield from "@/components/forms/tool-numberfield.vue";
import ToolTextfield from "@/components/forms/tool-textfield.vue";
import ToolOutput from "@/components/forms/tool-output.vue";
import ToolSection from "@/components/forms/tool-section.vue";
import ToolInput from "@/components/forms/tool-input.vue";
import PureDropdown from "@/components/forms/pure-dropdown.vue";
import ToolButton from "@/components/forms/tool-button.vue";
import {MissionManager} from "@/scripts/MissionManager.ts";
import type {Mission} from "@/model/mission.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {tosTime} from "@/scripts/math.ts";
import {strLatLong} from "@/scripts/conv.ts";
import {createProfileAlongPath} from "@/scripts/flightpath.ts";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  missionManager: {
    type: MissionManager,
    required: true
  }
})

//TODO: temp values to fill the form until impl
interface Steerpoint {
  alt: string;
  formation: string;
  enroute: string;
  action: string;
  duration: string;
}

//TODO: temp values to fill the form until impl
const steer = reactive<Steerpoint>({
  alt: "22000",
  formation: "3",
  enroute: "0",
  action: "10",
  duration: "25"
});

interface Flight {
  dist: number;
  duration: number;
  fuel: number;
  bingo: number;
  playtime: number;
}

const flight = reactive<Flight>({
  dist: 432.6,
  duration: 2.5,
  fuel: 7500,
  bingo: 3500,
  playtime: 125,
});

const formations: ValueCaptionPair[] = ([
  {value: "0", caption: "Arrowhead"},
  {value: "1", caption: "Box"},
  {value: "2", caption: "Figthing Wing"},
  {value: "3", caption: "Finger Four"},
  {value: "4", caption: "Fluid Four"},
  {value: "5", caption: "Ladder"},
  {value: "6", caption: "Line Abreast"},
  {value: "7", caption: "ResCell"},
  {value: "8", caption: "Route"},
  {value: "9", caption: "Spread"},
  {value: "10", caption: "Stack"},
  {value: "11", caption: "Trail"},
  {value: "12", caption: "Wedge"},
]);

const actions: ValueCaptionPair[] = ([
  {value: "0", caption: "Nav"},
  {value: "1", caption: "Takeoff"},
  {value: "2", caption: "Push"},
  {value: "3", caption: "Split"},
  {value: "4", caption: "Refuel"},
  {value: "5", caption: "Rearm"},
  {value: "6", caption: "Pickup"},
  {value: "7", caption: "Land"},
  {value: "8", caption: "Holding Pt"},
  {value: "9", caption: "Contact"},
  {value: "10", caption: "Escord"},
  {value: "11", caption: "Sweep"},
  {value: "12", caption: "CAP"},
  {value: "13", caption: "Intercept"},
  {value: "14", caption: "Grnd Attack"},
  {value: "15", caption: "Surf Attack"},
  {value: "16", caption: "S&D"},
  {value: "17", caption: "Strike"},
  {value: "18", caption: "Bomb"},
  {value: "19", caption: "SEAD"},
  {value: "20", caption: "ELINT"},
  {value: "21", caption: "Recon"},
  {value: "22", caption: "Rescue"},
  {value: "23", caption: "ASW"},
  {value: "24", caption: "Fuel"},
  {value: "25", caption: "Air Drop"},
  {value: "26", caption: "Jamming"},
])

const flights: ValueCaptionPair[] = ([
  {value: "0", caption: "Beast1"},
  {value: "1", caption: "Jaguar5"},
  {value: "2", caption: "Eagle7"},
  {value: "3", caption: "Cyborg2"},
])

const chxs: ValueCaptionPair[] = ([
  {value: "11", caption: "11/74"},
  {value: "12", caption: "12/75"},
  {value: "13", caption: "13/76"},
  {value: "14", caption: "14/77"},
  {value: "15", caption: "15/78"},
  {value: "16", caption: "16/79"},
  {value: "17", caption: "17/80"},
  {value: "18", caption: "18/81"},
  {value: "19", caption: "19/82"},
  {value: "20", caption: "20/83"},
  {value: "21", caption: "21/84"},
  {value: "22", caption: "22/85"},
  {value: "23", caption: "23/86"},
  {value: "24", caption: "24/87"},
])

interface Package {
  flight: string;
  seat: string;
  chx: string;
  band: string;
  fuel: number;
}

const pkg = reactive<Package>({
  flight: flights[0]!.value,
  seat: "1",
  chx: chxs[0]!.value,
  band: "1",
  fuel: 7000,
});

const emit = defineEmits(['close', 'btnClick'])

function btnClick(sender: string) {
  emit('btnClick', sender)
}

const global = useGlobalStore()
const baseUrl = import.meta.env.BASE_URL
// 24h time format: HH:MM:SS
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
const mission = ref<Mission>()
const profileVisible = ref(false)
const profileImage = ref("")

onMounted(() => {
  props.missionManager.onDataCartridgeEvent(() => {
    mission.value = props.missionManager.getMission()
  })
})

const showProfile = async () => {
  if (!mission.value) return

  const cutIndex = mission.value.route.findIndex(wpt => wpt.tgt.action === 7)
  const cutRoute = cutIndex !== -1 ? mission.value.route.slice(0, cutIndex + 1) : mission.value.route

  const waypoints = cutRoute.map(wpt => ({
    x: wpt.tgt.x / global.map!.pixels * 1024,
    y: wpt.tgt.y / global.map!.pixels * 1024
  }))

  const heightMaskPath = `${baseUrl}/heightmasks/${global.map!.name}.png`

  try {
    profileImage.value = await createProfileAlongPath(heightMaskPath, waypoints)
    profileVisible.value = true
  } catch (e) {
    console.error("Failed to generate profile", e)
  }
}

const prevWaypoint = () => {
  const idx = global.currentWaypoint!.no - 1
  if (idx > 0)
    global.currentWaypoint = mission.value!.route![idx - 1]
}

const nextWaypoint = () => {
  const idx = global.currentWaypoint!.no - 1
  if (idx < mission.value!.route!.length - 1)
    global.currentWaypoint = mission.value!.route![idx + 1]
}

const track = computed(() => {
    return `${global.currentWaypoint?.crs}° ${global.currentWaypoint?.dist.toFixed(1)}NM`
  }
)

const tos = computed(() => {
    return tosTime(global.currentWaypoint!.tos)
  }
)

const coord = computed(() => {
    const crd = strLatLong(global.currentWaypoint!.tgt.crd)
    return `${crd.lat} ${crd.long}`
  }
)

const type = computed(() => {
    return props.missionManager.getSteerpointType(global.currentWaypoint!)
  }
)

</script>

<template>
  <tool-window :visible="visible" @close="emit('close')">
    <tool-tabs v-if="mission" :tabs="['Route','Radio','Mission']">
      <template #Route>
        <tool-spacer medium/>
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between;">
          <div>{{ type }}</div>
          <div>{{ global.currentWaypoint!.no }}</div>
          <div style="display: flex; gap: 8px;">
            <img class="btn" src="/common/assets/icon_left.png" alt="left" @click="prevWaypoint">
            <img class="btn" src="/common/assets/icon_right.png" alt="right" @click="nextWaypoint">
          </div>
        </div>
        <tool-spacer separator/>
        <tool-spacer/>
        <div class="coord">{{ coord }}</div>
        <tool-spacer/>
        <tool-textfield label="TOS" v-model="tos" :regexp="timeRegex"/>
        <tool-numberfield label="TAS" v-model="global.currentWaypoint!.spd" :min="150" :max="600" value="350" :step="1" unit="kts"/>
        <tool-numberfield label="Alt" v-model="steer.alt" :min="0" :max="45000" value="24000" :step="1" unit="ft"/>
        <tool-spacer medium/>
        <tool-output id="trk-val" name="trk" label="Track" :value="track"/>
        <tool-spacer medium/>
        <tool-dropdown label="Formation" :options="formations" v-model="steer.formation"/>
        <tool-dropdown label="Enroute" v-model="steer.enroute">
          <option value="0">Nav</option>
          <option value="1">SEAD</option>
        </tool-dropdown>
        <tool-dropdown label="Action" :options="actions" v-model="steer.action"/>
        <tool-textfield label="Duration" v-model="steer.duration" unit="min"/>
        <tool-spacer/>
        <tool-button id="showProfile" icon="/common/icons/flight-profile.png" @click="showProfile"/>
        <tool-button id="zoomRoute" icon="/common/icons/route.png" @click="btnClick"/>
        <tool-spacer separator/>
        <tool-output label="AWACS" value="Lynx5"/>
        <tool-output label="Tanker" value="Texaco"/>
        <tool-spacer/>
      </template>
      <template #Radio>
      </template>
      <template #Mission>
        <tool-section name="Flight 1"/>
        <tool-output variant="b" id="flt-dist" align="right" label="Total Distance" :value="flight.dist" unit="nm"/>
        <tool-output variant="b" id="flt-time" align="right" label="Flight Duration" :value="flight.duration" unit="hrs"/>
        <tool-output variant="b" id="flt-fuel" align="right" label="Estimated Fuel" :value="flight.fuel" unit="lbs"/>
        <tool-output variant="b" id="flt-bingo" align="right" label="Bingo" :value="flight.bingo" unit="lbs"/>
        <tool-output variant="b" id="flt-play" align="right" label="Playtime" :value="flight.playtime" unit="min"/>
        <tool-section name="Package 1"/>
        <tool-input variant="c" label="Flight" for="pkg-flight">
          <div style="display: flex; width: 100%; gap: 4px;">
            <div style="flex: 9">
              <pure-dropdown id="pkg-flight" name="flight" :options="flights" v-model="pkg.flight"/>
            </div>
            <div style="flex: 3">
              <pure-dropdown id="pkg-seat" name="seat" v-model="pkg.seat">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </pure-dropdown>
            </div>
          </div>
        </tool-input>
        <tool-input variant="c" label="Chx" for="pkg-flight">
          <div style="display: flex; width: 100%; gap: 4px;">
            <div style="flex: 9">
              <pure-dropdown id="pkg-chx" name="chx" :options="chxs" v-model="pkg.chx"/>
            </div>
            <div style="flex: 3">
              <pure-dropdown id="pkg-band" name="band" v-model="pkg.band">
                <option value="1">Y</option>
                <option value="-1">X</option>
              </pure-dropdown>
            </div>
          </div>
        </tool-input>
        <tool-numberfield variant="c" id="pkg-fuel" label="Fuel" :min="2000" :max="15000" :step="100" v-model="pkg.fuel" unit="lbs"/>
        <tool-spacer medium/>
        <tool-button id="btn-flight" icon="/common/assets/icon_table1.png" @click="btnClick"/>
        <tool-button id="btn-wx" icon="/common/assets/icon_table.png" @click="btnClick"/>
      </template>
    </tool-tabs>
    <div v-else style="text-align: center">Mission not loaded.<br>Drag an ini.-file onto the map.</div>
  </tool-window>

  <div v-if="profileVisible" class="profile-popup">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <img :src="profileImage" alt="Profile" style="width: 800px; height: 300px; border: 1px solid #ccc;"/>
      <tool-button id="btn-close-profile" text="Close" @click="profileVisible = false"/>
    </div>
  </div>
</template>

<style scoped>
.coord {
  font-size: 14px;
  font-weight: bolder;
  font-family: monospace;
  text-align: center;
}

.btn {
  width: 16px;
  height: 16px;
}

.profile-popup {
  position: fixed;
  background-color: rgba(245, 245, 245, 1);
  border: 1px solid black;
  box-shadow: 6px 6px 9px #444;
  padding: 16px;
  left: 50%;
  top: 20%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

</style>
