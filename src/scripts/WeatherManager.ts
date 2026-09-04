import type {Fmap} from "@/model/fmap.ts";
import type {Point2D} from "@/model/base.ts";
import {useSettingsStore} from "@/stores/settings.ts";

const data_offset = {
  shower: [0, 0, 0, 0, 0, 0, 0, 0, 0, 93998],
  visibility: [0, 0, 0, 0, 0, 93998, 93998, 93998, 97479],
  fog: [0, 0, 0, 0, 0, 0, 0, 0, 0, 100960],
};

export class WeatherManager {

  private settings = useSettingsStore();

  private fmap: Fmap = {
    time: "10000Z",
    version: 0,
    changed: false,
    scaler: 1,
    dimension: {x: 0, y: 0},
    airmass: {direction: 0, speed: 0},
    turbulence: {top: 31000, bottom: 28000},
    contrail: [34000, 28000, 25000, 2000],
    cells: 0,
    type: [],
    pressure: [],
    temperature: [],
    wind: [],
    cloud: {base: [], cover: [], size: [], type: [],},
    shower: [],
    visibility: [],
    fog: [],

    analytics: {
      pressure_min: 1060,
      pressure_max: 950,
      temperature_min: 50,
      temperature_max: -50
    }
  };

  private clearWeather() {
    // Header Information
    this.fmap.version = 0;
    this.fmap.time = "10000Z";
    this.fmap.dimension = {x: 0, y: 0};
    this.fmap.airmass = {direction: 0, speed: 0};
    this.fmap.turbulence = {top: 31000, bottom: 28000};
    this.fmap.contrail = [34000, 28000, 25000, 2000];
    this.fmap.cells = 0;

    // Weather Data
    this.fmap.type = [];
    this.fmap.pressure = [];
    this.fmap.temperature = [];
    this.fmap.wind = [];
    this.fmap.cloud.base = [];
    this.fmap.cloud.cover = [];
    this.fmap.cloud.size = [];
    this.fmap.cloud.type = [];
    this.fmap.shower = [];
    this.fmap.visibility = [];
    this.fmap.fog = [];
    this.fmap.analytics = {
      pressure_min: 1060,
      pressure_max: 950,
      temperature_min: 50,
      temperature_max: -50
    };
  }

  private readMapInfo(buffer: any) {
    const view = new Uint32Array(buffer);
    if (view.length < 11) {
      return;
    }

    this.fmap.version = view[0] ?? 0;
    this.fmap.dimension.x = view[1] ?? 0;
    this.fmap.dimension.y = view[2] ?? 0;
    this.fmap.airmass.direction = view[3] ?? 0;
    this.fmap.airmass.speed = view[4] ?? 0;
    this.fmap.turbulence.top = view[5] ?? 0;
    this.fmap.turbulence.bottom = view[6] ?? 0;
    this.fmap.contrail[0] = view[7] ?? 0;
    this.fmap.contrail[1] = view[8] ?? 0;
    this.fmap.contrail[2] = view[9] ?? 0;
    this.fmap.contrail[3] = view[10] ?? 0;

    // Compute total cells
    this.fmap.cells = this.fmap.dimension.x * this.fmap.dimension.y;
  }

  // Read the BMS Weather Type (1: Sunny, 2: Fair, 3: Poor, 4: Inclement)
  private readWeatherType(buffer: any) {
    const offset = 11;
    const type = new Int32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = type[offset + i];
      }
      this.fmap.type.push(data);
    }
  }

  // Read the Atmospheric Pressure in mb / hPa
  private readAtmosphericPressure(buffer: any) {
    const offset = 3492;
    const pressure = new Float32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = pressure[offset + i]
        if (data[x] < this.fmap.analytics.pressure_min) this.fmap.analytics.pressure_min = data[x];
        if (data[x] > this.fmap.analytics.pressure_max) this.fmap.analytics.pressure_max = data[x];
      }
      this.fmap.pressure.push(data);
    }
  }

  // Read the Surface temperature in Celsius
  private readSurfaceTemperature(buffer: any) {

    const offset = 6973;
    const temperature = new Float32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = temperature[offset + i];
        if (data[x] < this.fmap.analytics.temperature_min) this.fmap.analytics.temperature_min = data[x];
        if (data[x] > this.fmap.analytics.temperature_max) this.fmap.analytics.temperature_max = data[x];
      }
      this.fmap.temperature.push(data);
    }
  }

  // Wind speed and direction for 10 altitudes:
  // 0ft, 3000ft, 6000ft, 9000ft, 12,000ft,
  // 18,000ft, 24,000ft, 30,000ft,
  // 40,000ft, 50,000ft
  private readWindVelocities(buffer: any) {

    const magnitude_offset = 10454;
    const direction_offset = 45264;
    const altitudes = 10;

    let winds = new Float32Array(buffer);

    // Iterate over the map cells
    for (let y = 0; y < this.fmap.dimension.y; y++) {

      let data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {

        let velocities = Array(altitudes).fill(0);
        // Process the 10 altitudes for each weather Cell in BMS
        for (let alt = 0; alt < altitudes; alt++) {
          const i = y * this.fmap.dimension.x * altitudes + x * altitudes + alt;
          const speed = winds[magnitude_offset + i];
          const direction = winds[direction_offset + i];
          velocities[alt] = {direction: direction, speed: speed};
        }
        data[x] = velocities;
      }
      this.fmap.wind.push(data);
    }
  }

// Read Cloud Base in Feet (Float)
  private readCloudBase(buffer: any) {
    const offset = 80074;
    let cloud_data = new Float32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = cloud_data[offset + i];
      }
      this.fmap.cloud.base.push(data);
    }
  }

  // Read Cloud Cover Data
  // (1: FEW, 5: SCT, 9: BKN, 13: OVC)
  // Weather Type Poor and Inclement should be minimum BKN.
  private readCloudCover(buffer: any) {
    const offset = 83555;
    let cloud_cover = new Int32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = cloud_cover[offset + i];
      }
      this.fmap.cloud.cover.push(data);
    }
  }

  // Read Cloud Size (0 Largest ... 5 Smallest)
  private readCloudSize(buffer: any) {
    const offset = 87036; // Cloud Size (checked)
    let cloud_size = new Float32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = cloud_size[offset + i];
      }
      this.fmap.cloud.size.push(data);
    }
  }

  // Read Cloud Type
  // Towering Cumulus (1: Yes, 0: No)
  private readCloudType(buffer: any) {
    const offset = 90517; // Cloud Type
    let cloud_type = new Int32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = cloud_type[offset + i];
      }
      this.fmap.cloud.type.push(data);
    }
  }

  // Read Shower Data
  // Showers (1: Yes, 0: No)
  private readShowerdata(buffer: any) {
    const offset = data_offset.shower[this.fmap.version] ?? 0; // (version 8 only)
    if (offset == 0) {
      this.fmap.shower = Array(this.fmap.cells).fill(0);
      return;
    }
    let shower = new Int32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = shower[offset + i];
      }
      this.fmap.shower.push(data);
    }
  }

  // Read Visibility 0 ... 60 km in Float
  private readVisibility(buffer: any) {
    const offset = data_offset.visibility[this.fmap.version] ?? 0; // Visibility LUT
    if (offset == 0) return;

    let visibility = new Float32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = visibility[offset + i];
      }
      this.fmap.visibility.push(data);
    }
  }

  // Read Fog altitude level (in Feet Float)
  private readFog(buffer: any) {
    const offset = data_offset.fog[this.fmap.version] ?? 0; // Version 8 only;
    if (offset == 0) {
      this.fmap.fog = Array(this.fmap.cells).fill(0);
      return;
    }

    let fog = new Float32Array(buffer);

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      let data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        let i = y * this.fmap.dimension.x + x;
        data[x] = fog[offset + i];
      }
      this.fmap.fog.push(data);
    }
  }

  // Process the .fmap binary buffer
  //TODO: check filename to time
  public processWeather(buffer: any, filename: string) {
    this.clearWeather();

    // Set the Weather Time
    this.fmap.time = filename.split(".")[0]!;

    // Read the Weather Data from .fmap
    this.readMapInfo(buffer);
    this.readWeatherType(buffer);
    this.readAtmosphericPressure(buffer);
    this.readSurfaceTemperature(buffer);
    this.readWindVelocities(buffer);
    this.readCloudBase(buffer);
    this.readCloudCover(buffer);
    this.readCloudSize(buffer);
    this.readCloudType(buffer);
    this.readShowerdata(buffer);
    this.readVisibility(buffer);
    this.readFog(buffer);
  }

  public getFmap() {
    return this.fmap;
  }

  public getMETAR(grid: Point2D) {
    // fmap Guard
    if (this.fmap.version == 0) return "";

    const x = grid.x;
    const y = grid.y;

    // Initialize the METAR string
    let metar_str = "";

    // Check if fog data exists
    const hasFog = !isNaN(this.fmap.fog[y]![x]!);

    // Get METAR Time component
    const time_str = this.padZeros(this.fmap.time, 6) + "Z";

    // Build the Wind String
    const wnd_dir = this.padZeros(Math.round(this.fmap.wind[y]![x]![0]!.direction).toString(), 3);
    const wnd_spd = this.padZeros(Math.round(this.fmap.wind[y]![x]![0]!.speed).toString(), 2);

    // Build the Visibility components
    let vis_str = "";
    const hasVisibility = (!isNaN(this.fmap.visibility[y]![x]!));
    let visibility = this.fmap.visibility[y]![x]! * 1000; // km to meters

    // If fog is present below 1000 then force visibility < 300 m
    if (hasFog && hasVisibility && this.fmap.fog[y]![x]! <= 300) if (visibility > 1000) visibility = 300;

    if (this.settings.settings.weather.metric) {
      if ((visibility > 9999) || !hasVisibility) visibility = 9999;
      else visibility = Math.round(visibility / 100) * 100;
      vis_str = this.padZeros(visibility.toString(), 4);
    } else {
      if ((visibility >= 16093.4) || !hasVisibility) vis_str = "10SM";
      else {
        vis_str = (Math.round(visibility / 1609.344)).toString();
        vis_str = this.padZeros(vis_str, 2) + "SM";
      }
    }

    // Weather Component with Present Weather and Obscuration
    const wx_shower = this.fmap.shower[y]![x]!;
    const wx_type = this.fmap.type[y]![x]!;
    const wx_temp = this.fmap.temperature[y]![x]!;
    const cloud_type = this.fmap.cloud.type[y]![x]!;
    const cloud_size = this.fmap.cloud.size[y]![x]!;
    let wx_str = "";

    if (wx_type == 4) {
      // Rain Types
      if (wx_temp > 0) {
        if (wx_shower == 1) {
          if (cloud_type == 1 && cloud_size < 1) wx_str = "TSRA ";
          else wx_str = "SHRA ";
        } else {
          if (cloud_type == 1) wx_str = "+RA ";
          else wx_str = "RA ";
        }
      } // Snow Types
      else {
        if (wx_shower == 1) wx_str = "SN ";
        else wx_str = "FZRA ";
      }
    }

    // Add obscurations
    // Check for Fog and Mist
    if (hasFog && hasVisibility) {
      if (this.fmap.fog[y]![x]! <= 300 && wx_type > 1) {
        // Check for fog
        if (visibility < 1000) wx_str += (wx_temp < 0) ? "FZFG " : "FG ";
        else if (visibility < 5000) wx_str += "BR ";
      } else {
        // Check for Haze
        if (visibility < 5000 && wx_type < 4) wx_str += "HZ ";
      }
    }

    // Build Cloud Component
    let cld_str = "CLR";
    const cloud_cover = this.fmap.cloud.cover[y]![x]!;
    let ceiling = this.fmap.cloud.base[y]![x]!;
    const fog = this.fmap.fog[y]![x]!;

    ceiling = (hasFog && fog < ceiling) ? fog : ceiling;

    if (ceiling > 0) {
      const base = Math.round(ceiling / 100);
      const base_str = this.padZeros(base.toString(), 3);
      if (cloud_cover > 0) cld_str = "FEW" + base_str;
      if (cloud_cover >= 3) cld_str = "SCT" + base_str;
      if (cloud_cover >= 5) cld_str = "BKN" + base_str;
      if (cloud_cover >= 9) cld_str = "OVC" + base_str;
      if (cloud_type > 0 && cloud_cover > 0) cld_str += "CB";
    }

    // Build Temperature String
    let temp_str = "";
    let dew_str = "/";
    let temp = this.fmap.temperature[y]![x]!;
    const base = (hasFog && fog > 0 && fog < ceiling) ? fog : ceiling;
    let dew = (wx_type == 4) ? this.fmap.temperature[y]![x]! : (temp - base / 1000 * 1.2);

    // If sky clear assume RH = 50% then set dew accordingly
    // Td = T - ((100 - RH)/5.)
    // RH = 100 - 5(T - Td)
    // See Paper by Mark G. Lawrence
    if (cld_str.includes("CLR")) dew = temp - ((100 - 50) / 5);

    // Temperature
    if (temp < 0) temp_str += "M";
    temp_str += this.padZeros(Math.round(Math.abs(temp)).toString(), 2);

    // Dewpoint
    if (dew < 0) dew_str += "M";
    dew_str += this.padZeros(Math.round(Math.abs(dew)).toString(), 2);

    // Build the Pressure String
    let baro_str = "";
    const baro = this.fmap.pressure[y]![x]!;
    if (this.settings.settings.weather.metric) baro_str = "Q" + this.padZeros((baro.toFixed(0)).toString(), 4);
    else baro_str = "A" + (baro * 0.0295301 * 100).toFixed(0);

    // Build the METAR String
    metar_str += time_str + " " +
      wnd_dir + wnd_spd + "KT " +
      vis_str + " " +
      wx_str +
      cld_str + " " +
      temp_str + dew_str + " " +
      baro_str;

    return metar_str;
  }

  //TODO: put this in utility class
  private padZeros(str: string, num: number) {
    while (str.length < num) str = "0" + str;
    return str;
  }

}
