export interface GfsDatum {
  lat: string | number
  long: string | number
}

export interface GfsTheaterBox {
  top: number
  left: number
  right: number
  bottom: number
}

const gfs_grib_0p25 = 'https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?'

const gfs_levels = "&lev_100_mb=on&lev_150_mb=on&lev_200_mb=on&lev_300_mb=on&lev_400_mb=on&lev_500_mb=on&lev_650_mb=on&lev_700_mb=on&lev_850_mb=on&lev_925_mb=on&lev_2_m_above_ground=on&lev_10_m_above_ground=on&lev_convective_cloud_layer=on&lev_high_cloud_layer=on&lev_low_cloud_layer=on&lev_mean_sea_level=on&lev_middle_cloud_layer=on&lev_surface=on&lev_convective_cloud_bottom_level=on&lev_convective_cloud_top_level=on&lev_high_cloud_bottom_level=on&lev_high_cloud_top_level=on&lev_low_cloud_bottom_level=on&lev_low_cloud_top_level=on&lev_middle_cloud_bottom_level=on&lev_middle_cloud_top_level=on"

const gfs_params = "&var_ACPCP=on&var_APCP=on&var_PRATE=on&var_PRMSL=on&var_TCDC=on&var_TMP=on&var_UGRD=on&var_VGRD=on&var_VIS=on&var_PRES=on"

// Builds the NOAA grib filter URL for a theater and downloads the GFS forecast
export class GfsDownload {

  // Download the grib2 forecast for the theater at datum
  public downloadGrib2(datum: GfsDatum, date: string, cycle: number, offset: number): void {
    const url = this.constructURL(datum, date, cycle, offset)
    const filename = this.getFilename(cycle, offset)
    const downloadLink = document.createElement('a')
    downloadLink.setAttribute('download', filename)
    downloadLink.setAttribute('href', new URL(url).toString())
    downloadLink.click()
  }

  // Get Products without query
  // Just estimate the update time based on NOAA schedule
  // No need to query (They prefer this)
  public getAvailableProd(): string[] {
    const date = new Date()
    const prod = []

    date.setUTCDate(date.getUTCDate() - 1)

    // Get the values for Year, Month and Day
    // Only go back 7 previous days GFS supports 10
    for (let i = 0; i < 7; i++) {
      // Get Values
      const year = date.getUTCFullYear()
      const month = date.getUTCMonth()
      const day = date.getUTCDate()

      // Make String version
      let day_str = day.toString()
      let month_str = (month + 1).toString()
      let year_str = year.toString()

      // Add padding
      day_str = (day_str.length == 1) ? "0" + day_str : day_str
      month_str = (month_str.length == 1) ? "0" + month_str : month_str
      year_str = (year_str.length == 1) ? "0" + year_str : year_str

      // Create Prod String
      const date_str = year_str + month_str + day_str
      prod.push(date_str)
      date.setUTCDate(date.getUTCDate() - 1)
    }
    return prod
  }

  // Experimental Should Work but on GFS due to CORS blocked
  public fetchForecast(url: string): void {
    fetch(url, {
      method: 'GET',
      headers: {}
    }).then(response => response.blob()).then(blob => console.log(blob))
  }

  // Construct name like: gfs.t18z.pgrb2.0p25.f001
  private getFilename(cycle: string | number, offset: string | number): string {
    const cycleStr = cycle.toString().padStart(2, "0")
    const forecastStr = offset.toString().padStart(3, "0")
    return "gfs.t" + cycleStr + "z.pgrb2.0p25.f" + forecastStr
  }

  // Construct name like: %2Fgfs.20230531%2F18%2Fatmos
  private getDirname(date: string, cycle: string | number): string {
    const cycleStr = cycle.toString().padStart(2, "0")
    return "%2Fgfs." + date + "%2F" + cycleStr + "%2Fatmos"
  }

  // Set the bounding box for the region
  private getTheaterBox(datum: GfsDatum): GfsTheaterBox {
    const b_lat = Math.round(parseFloat(String(datum.lat)))
    const t_lat = b_lat + 9.0
    const l_long = Math.round(parseFloat(String(datum.long)))
    const r_long = l_long + 9.0
    return {top: t_lat, left: l_long, right: r_long, bottom: b_lat}
  }

  // Construct theater region: &toplat=90&leftlon=0&rightlon=360&bottomlat=-90
  // So provide left and right longitude and top and bottom latitude
  private getTheaterSubRegion(datum: GfsDatum): string {
    const box = this.getTheaterBox(datum)
    return "&toplat=" + box.top + "&leftlon=" + box.left + "&rightlon=" + box.right + "&bottomlat=" + box.bottom
  }

  private constructURL(datum: GfsDatum, date: string, cycle: string | number, offset: string | number): string {
    const filename = this.getFilename(cycle, offset)
    const dirname = this.getDirname(date, cycle)
    const subregion = this.getTheaterSubRegion(datum)
    const grib_filter = "dir=" + dirname + "&file=" + filename + gfs_params + gfs_levels + "&subregion=" + subregion
    return gfs_grib_0p25 + grib_filter
  }
}
