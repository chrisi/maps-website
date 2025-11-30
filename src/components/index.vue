<script setup lang="ts">

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
    <h2>Theater Maps 4.38</h2>

    <div style="flex-wrap: wrap; display: flex; justify-content: space-evenly">
      <div class="container">
        <div style="text-align: center">Korea Theater</div>
        <div class="polaroid">
          <router-link to="/map/korea">
            <img src="https://cdn.falcon-bms.com/maps/web_assets/01_kto-thumb.jpeg"
                 width="150" height="150" alt="Korea Theater" border="0" class="image">
          </router-link>
        </div>
      </div>

      <div class="container">
        <div style="text-align: center">Balkans Theater</div>
        <div class="polaroid">
          <router-link to="/map/balkans">
            <img src="https://cdn.falcon-bms.com/maps/web_assets/02_balkans-thumb.jpeg"
                 width="150" height="150" alt="Balkans Theater" border="0" class="image">
          </router-link>
        </div>
      </div>
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
    <h5 style="text-align: left;"><a href="https://forum.falcon-bms.com/topic/22922/falcon-bms-interactive-maps" target="_blank">Change
      log</a> &nbsp;| &nbsp;<a href="https://cdn.falcon-bms.com/maps/manual/BMS_Interactive_Maps.pdf" target="_blank">Manual (PDF)</a>
    </h5>
    <hr>
  </div>
</template>

<style scoped>
body {
  margin: 0;
  padding: 0;
  background-color: white;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Montserrat', Helvetica, Arial, Lucida, sans-serif;
  color: #5a87a4;
}

font {
  font-family: Verdana, Arial, Helvetica, sans-serif;
  color: #000000;
}

font_small {
  font-family: Verdana, Arial, Helvetica, sans-serif;
  font-size: 12px;
  color: #5a87a4;
}

center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

a {
  text-decoration: none;
}

div.polaroid {
  width: 155px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.container:hover .image {
  opacity: 0.8;
  color: #000000;
}

font_right {
  text-align: right;
}

table {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
  border-collapse: collapse;
  margin: 0;
  padding: 0;
  width: 100%;
  table-layout: fixed;
}

table caption {
  font-size: 1.5em;
}

table th,
table td {
  text-align: center;
}

table th {
  text-transform: uppercase;
}

.color_background {
  color: #163546;
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
</style>
