import {createEmptyFmap, type Fmap} from "@/model/fmap.ts"
import type {Point2D} from "@/model/base.ts"
import {useGlobalStore} from "@/stores/global.ts"
import {useSettingsStore} from "@/stores/settings.ts"
import {FmapImport} from "@/scripts/weather/FmapImport.ts"
import {GfsDownload} from "@/scripts/weather/GfsDownload.ts"
import {GfsConverter} from "@/scripts/weather/GfsConverter.ts"
import {padZeros} from "@/scripts/utils.ts"

export class WeatherManager {

  private settings = useSettingsStore();
  private global = useGlobalStore();

  private fmap: Fmap = createEmptyFmap();

  private weatherEventHandler: ((fmap: Fmap) => void)[] = [];

  private fmapImport = new FmapImport();
  private gfsConverter = new GfsConverter();
  private gfsDownlaod = new GfsDownload();

  public onWeatherEvent(cb: ((fmap: Fmap) => void)) {
    this.weatherEventHandler.push(cb);
  }

  // Process the .fmap binary buffer
  public processWeather(buffer: ArrayBuffer, filename: string) {
    this.fmap = this.fmapImport.import(buffer, filename)
    this.setWeather(this.fmap)
  }

  // Process the GFS grib2 binary buffer
  public processGrib2(buffer: ArrayBuffer) {
    this.fmap = this.gfsConverter.convertGrib2(buffer)
    this.setWeather(this.fmap)
  }

  public downloadGrib2(date: string, cycle: number, offset: number) {
    this.gfsDownlaod.downloadGrib2(this.global.map!.datum, date, cycle, offset)
  }

  private setWeather(fmap: Fmap) {
    this.weatherEventHandler.forEach(cb => cb(fmap))
  }

  public getMETAR(grid: Point2D) {
    const fmap = this.fmap

    // fmap Guard
    if (fmap.version == 0) return ""

    const x = grid.x;
    const y = grid.y;

    // Initialize the METAR string
    let metar_str = "";

    // Check if fog data exists
    const hasFog = !isNaN(fmap.fog[y]![x]!);

    // Get METAR Time component
    const time_str = padZeros(fmap.time, 6) + "Z";

    // Build the Wind String
    const wnd_dir = padZeros(Math.round(fmap.wind[y]![x]![0]!.direction).toString(), 3);
    const wnd_spd = padZeros(Math.round(fmap.wind[y]![x]![0]!.speed).toString(), 2);

    // Build the Visibility components
    let vis_str = "";
    const hasVisibility = (!isNaN(fmap.visibility[y]![x]!));
    let visibility = fmap.visibility[y]![x]! * 1000; // km to meters

    // If fog is present below 1000 then force visibility < 300 m
    if (hasFog && hasVisibility && fmap.fog[y]![x]! <= 300) if (visibility > 1000) visibility = 300;

    if (this.settings.settings.weather.metric) {
      if ((visibility > 9999) || !hasVisibility) visibility = 9999;
      else visibility = Math.round(visibility / 100) * 100;
      vis_str = padZeros(visibility.toString(), 4);
    } else {
      if ((visibility >= 16093.4) || !hasVisibility) vis_str = "10SM";
      else {
        vis_str = (Math.round(visibility / 1609.344)).toString();
        vis_str = padZeros(vis_str, 2) + "SM";
      }
    }

    // Weather Component with Present Weather and Obscuration
    const wx_shower = fmap.shower[y]![x]!;
    const wx_type = fmap.type[y]![x]!;
    const wx_temp = fmap.temperature[y]![x]!;
    const cloud_type = fmap.cloud.type[y]![x]!;
    const cloud_size = fmap.cloud.size[y]![x]!;
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
      if (fmap.fog[y]![x]! <= 300 && wx_type > 1) {
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
    const cloud_cover = fmap.cloud.cover[y]![x]!;
    let ceiling = fmap.cloud.base[y]![x]!;
    const fog = fmap.fog[y]![x]!;

    ceiling = (hasFog && fog < ceiling) ? fog : ceiling;

    if (ceiling > 0) {
      const base = Math.round(ceiling / 100);
      const base_str = padZeros(base.toString(), 3);
      if (cloud_cover > 0) cld_str = "FEW" + base_str;
      if (cloud_cover >= 3) cld_str = "SCT" + base_str;
      if (cloud_cover >= 5) cld_str = "BKN" + base_str;
      if (cloud_cover >= 9) cld_str = "OVC" + base_str;
      if (cloud_type > 0 && cloud_cover > 0) cld_str += "CB";
    }

    // Build Temperature String
    let temp_str = "";
    let dew_str = "/";
    const temp = fmap.temperature[y]![x]!;
    const base = (hasFog && fog > 0 && fog < ceiling) ? fog : ceiling;
    let dew = (wx_type == 4) ? fmap.temperature[y]![x]! : (temp - base / 1000 * 1.2);

    // If sky clear assume RH = 50% then set dew accordingly
    // Td = T - ((100 - RH)/5.)
    // RH = 100 - 5(T - Td)
    // See Paper by Mark G. Lawrence
    if (cld_str.includes("CLR")) dew = temp - ((100 - 50) / 5);

    // Temperature
    if (temp < 0) temp_str += "M";
    temp_str += padZeros(Math.round(Math.abs(temp)).toString(), 2);

    // Dewpoint
    if (dew < 0) dew_str += "M";
    dew_str += padZeros(Math.round(Math.abs(dew)).toString(), 2);

    // Build the Pressure String
    let baro_str = "";
    const baro = fmap.pressure[y]![x]!;
    if (this.settings.settings.weather.metric) baro_str = "Q" + padZeros((baro.toFixed(0)).toString(), 4);
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
}
