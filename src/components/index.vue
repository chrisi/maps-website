<script setup lang="ts">

import TheaterLink from "@/components/theater-link.vue";
</script>

<template>
  <div class="blue-bar" style="text-align: center;">
    <a href="https://www.falcon-bms.com">
      <img src="https://www.falcon-bms.com/wp-content/uploads/2021/07/web_logo_large_alt.png" width="324" height="83" alt="">
    </a>
  </div>
  <div class="content">
    <h1>Falcon BMS - Interactive Maps</h1>
    <hr>
    <h2>Theater Maps 4.37</h2>
    <div class="flex">
      <theater-link link="https://maps.falcon-bms.com/01_KTO_Interactive_Map/index.html"
                    name="KOREA" sub="Rev: 26 JUNE 2023" image="01_kto-thumb.jpeg"/>
      <theater-link link="https://maps.falcon-bms.com/02_Balkans_Interactive_Map/index.html"
                    name="BALKANS" sub="Rev: 26 JUNE 2023" image="02_balkans-thumb.jpeg"/>
      <theater-link link="https://maps.falcon-bms.com/03_ITO_Interactive_Map/index.html"
                    name="ISRAEL" sub="Rev: 26 JUNE 2023" image="03_ito-thumb.jpeg"/>
      <div style="width: 163px"></div>
    </div>
    <h2>Theater Maps 4.38</h2>
    <div class="flex">
<!--      <theater-link link="/map/korea" name="KOREA" sub="IN DEVELOPMENT" image="04_kto-thumb.jpeg"/>-->
      <theater-link link="/map/test" name="KOREA" sub="IN DEVELOPMENT" image="04_kto-thumb.jpeg"/>
      <theater-link link="/map/balkans" name="BALKANS" sub="IN DEVELOPMENT" image="05_balkans-thumb.jpeg"/>
      <theater-link name="ISRAEL" sub="PLANNED" image="06_ito-thumb.jpeg"/>
      <theater-link name="HELLENIC" sub="PLANNED" image="07_hto-thumb.jpeg"/>
    </div>
    <h2>Map Features</h2>
    The maps provide the following features:
    <ul>
      <li>Locate airports and navigation beacons and request their information by hovering over them</li>
      <li>Move map, zoom in/out and measure distances on map</li>
      <li>Mission.ini or Pilot.ini drag and drop to show route on map and more.</li>
      <li>Full whiteboard collaboration using collaboration server</li>
      <li>Save Whiteboard(.png) and restore with drag and drop</li>
      <li>MIL-STD-2525D symbology</li>
      <li>Weather import (fmap drop) for weather charts (Temperature, Doppler, Winds, Isobars)</li>
      <li>Route Waypoint dialog (actions, heading, distance and duration updates, etc)</li>
      <li>Computed Mission Flight Info, Mission Radio Frequencies and Mission Objectives</li>
      <li>Show Lat/Long on map and x,y of image map</li>
      <li>Aerodrome Weather Report (METAR) as tooltips and on route dialog (uses) fmap</li>
      <li>Download and Import GFS data and files</li>
      <li>Bullseye placement</li>
    </ul>
    <h5 style="text-align: left;">
      <a href="https://forum.falcon-bms.com/topic/22922/falcon-bms-interactive-maps" target="_blank">Change log</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href="https://cdn.falcon-bms.com/maps/manual/BMS_Interactive_Maps.pdf" target="_blank">Manual (PDF)</a>
    </h5>
    <hr>
  </div>
</template>

<style scoped>

.flex {
  flex-wrap: wrap;
  display: flex;
  justify-content: space-evenly
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Montserrat', Helvetica, Arial, Lucida, sans-serif;
  color: #5a87a4;
}

h2 {
  margin-top: 30px;
}

.blue-bar {
  width: 100%;
  height: 50px;
  background-color: #1E3444;
  padding-top: 20px; /* Adds 20px space above the image */
}

.content {
  padding: 20px;
  margin: 30px 50px;
}

a {
  color: #5a87a4;
  text-decoration: none;
}
</style>
