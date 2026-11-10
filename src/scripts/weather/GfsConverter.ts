// BMS Interactive Maps GFS access
//
// Decoding per: https://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_doc/
// Regulations (bit encoding / decoding): https://codes.ecmwf.int/grib/format/grib2/regulations/
import {createEmptyFmap, type Fmap} from "@/model/fmap.ts"
import {arrayToInt, arrayToStr, padZeros} from "@/scripts/utils.ts"

const GFS_DEBUG = false

interface GfsBuffer {
  name: string
  offset?: number
  scale?: number
  level: number
  data: number[]
}

interface GridDefinition {
  name?: string
  Ni?: number
  Nj?: number

  [key: string]: number | string | undefined
}

interface ProductDefinition {
  name?: string
  param_cat?: number
  param_num?: number
  surface1_type?: number
  surface1_value?: number
  time_forecast?: number

  [key: string]: number | string | undefined
}

interface DataDefinition {
  name?: string
  ref_value?: number
  bin_scale?: number
  dec_scale?: number
  bits?: number
  type?: number

  [key: string]: number | string | undefined
}

// Converts the grib2 data into an Fmap
export class GfsConverter {

  private fmap: Fmap = createEmptyFmap()

  // Pressure Altitudes close to the BMS altitude wind layers in Pa
  private gfsPressureAltitide = [10, 92500, 85000, 70000, 65000, 50000, 40000, 30000, 20000, 10000]

  // Message enumeration
  // This is param category and param num combined from Message section 4
  private gfsMsgType = {
    TMP: 0, PRATE: 263, APCP: 264, ACPCP: 266, UGRD: 514, VGRD: 515,
    PRES: 768, PRMSL: 769, TCDC: 1537, VIS: 4864, UNKN: -1,
  }

  // Standard pressures for 0 to 20000 ft
  private gfsPressureLUT = [
    1013, 977, 942, 908, 875, 843, 812, 782, 753, 724, 697,
    670, 644, 619, 595, 572, 549, 527, 506, 485, 466
  ]

  // Standard Temp for 0 to 20000 ft
  private gfsTemperatureLUT = [
    15.0, 13.0, 11.0, 9.1, 7.1, 5.1, 3.1, 1.1, -0.8, -2.8, -4.8,
    -6.8, -8.8, -10.8, -12.7, -14.7, -16.7, -18.7, -20.7, -22.6, -24.6
  ]

  // GFS File Structure
  private gfs_file: {
    offset: number
    bytes: Uint8Array
    msg_cnt: number
  } = {
    offset: 0,
    bytes: new Uint8Array(),
    msg_cnt: 0,
  }

  private gfs_msg = {
    s0: {
      name: 'Indicator', section: 0, offset: 0,
      grib: "",
      discipline: 0,
      edition: 0,
      size: 0
    },
    s1: {
      name: 'Identification', offset: 16, size: 0, section: 1,
      center: 0, subcenter: 0,
      mastr_tbl_ver: 0, local_tbl_ver: 0,
      time_ref: 0,
      year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0,
      status: 0,
      type: 0,
    },
    s2: {
      name: 'Local Use', offset: 0, size: 0, section: 2,
      local: [] as number[]
    },
    s3: {
      name: 'Gird Definition', offset: 0, size: 0, section: 3,
      gird_source: 0,
      grid_source: 0,
      num_points: 0,
      list_num: 0,
      num_octets: 0,
      template: 0,
      def: {} as GridDefinition,
    },
    s4: {
      name: 'Product Definition', offset: 0, size: 0, section: 4,
      num_coords: 0,
      template: 0,
      def: {} as ProductDefinition,
    },
    s5: {
      name: 'Data Representation', offset: 0, size: 0, section: 5,
      num_points: 0,
      template: 0,
      def: {} as DataDefinition,
    },
    s6: {
      name: 'Bitmap', offset: 0, size: 0, section: 6,
      indicator: 0, bitmap: new Uint8Array() as Uint8Array<ArrayBufferLike>,
    },
    s7: {
      name: 'Data', offset: 0, size: 0, section: 6, data: new Uint8Array() as Uint8Array<ArrayBufferLike>,
    },
    s8: {
      name: 'End', offset: 0, size: 4, tag: "",
    },
  }

  // GFS Message Buffers and Transcoding scaling and offset
  private gfs: Record<"prmsl" | "vis" | "tmp" | "tcdc" | "ugrd" | "vgrd" | "pres" | "prate" | "apcp" | "acpcp", GfsBuffer> = {
    prmsl: {name: 'PRMSL', offset: 0.00, scale: 0.01, level: -1, data: []},
    vis: {name: 'VIS', offset: 0.00, scale: 0.001, level: -1, data: []},
    tmp: {name: 'TMP', offset: -273.15, scale: 1.00, level: -1, data: []},
    tcdc: {name: 'TCDC', offset: 0.00, scale: 0.125, level: -1, data: []},
    ugrd: {name: 'UGRD', offset: 0.00, scale: 1.944, level: -1, data: []},
    vgrd: {name: 'VGRD', offset: 0.00, scale: 1.944, level: -1, data: []},
    pres: {name: 'VGRD', offset: 0.00, scale: 0.01, level: -1, data: []},
    prate: {name: 'VGRD', offset: 0.00, scale: 3600, level: -1, data: []},
    apcp: {name: 'VGRD', level: -1, data: []},
    acpcp: {name: 'VGRD', level: -1, data: []},
  }

  // Convert a grib2 buffer into an Fmap
  public convertGrib2(buffer: ArrayBuffer): Fmap {
    // Initialization Code
    this.initializeFmap()

    // Initialize GFS
    this.gfs_file.bytes = new Uint8Array(buffer)
    this.gfs_file.offset = 0
    this.gfs_file.msg_cnt = 0

    while (this.gfs_file.offset < this.gfs_file.bytes.length) {
      this.gfs_file.msg_cnt++
      this.readGrib2Msg()
      this.processGrib2Msg()
    }

    // Set BMS Weather type here
    this.determineWxType()
    this.airmassDirSpd()
    this.forecastTime()

    this.fmap.changed = true
    this.gfs_file.bytes = new Uint8Array()
    return this.fmap
  }

  // Get Octet
  private sectionOctet(start: number, end: number): Uint8Array {
    return this.gfs_file.bytes.slice(this.gfs_file.offset + start - 1, this.gfs_file.offset + end)
  }

  private sectionInt(start: number, end: number): number {
    return arrayToInt(this.endianness(this.sectionOctet(start, end)))
  }

  private sectionFloat32(s: number, e: number): number {
    const buf = new Uint8Array(this.sectionOctet(s, e)).buffer
    const value = new DataView(buf)
    return value.getFloat32(0)
  }

  private msgReadSection0() {
    this.gfs_msg.s0.offset = this.gfs_file.offset
    this.gfs_msg.s0.grib = arrayToStr(this.sectionOctet(1, 4))
    if (this.gfs_msg.s0.grib === 'GRIB') {
      this.gfs_msg.s0.discipline = this.sectionInt(7, 7)
      this.gfs_msg.s0.edition = this.sectionInt(8, 8)
      this.gfs_msg.s0.size = this.sectionInt(9, 16)
      this.gfs_file.offset += 16
      this.debug(this.gfs_msg.s0)
    }
  }

  private msgReadSection1() {
    this.gfs_msg.s1.offset = this.gfs_file.offset
    this.gfs_msg.s1.size = 0
    this.gfs_msg.s1.section = arrayToInt(this.sectionOctet(5, 5))
    if (this.gfs_msg.s1.section == 1) {
      this.gfs_msg.s1.offset = this.gfs_file.offset
      this.gfs_msg.s1.size = this.sectionInt(1, 4)
      this.gfs_msg.s1.center = this.sectionInt(6, 7)
      this.gfs_msg.s1.subcenter = this.sectionInt(8, 9)
      this.gfs_msg.s1.mastr_tbl_ver = this.sectionInt(10, 10)
      this.gfs_msg.s1.local_tbl_ver = this.sectionInt(11, 11)
      this.gfs_msg.s1.time_ref = this.sectionInt(12, 12)
      this.gfs_msg.s1.year = this.sectionInt(13, 14)
      this.gfs_msg.s1.month = this.sectionInt(15, 15)
      this.gfs_msg.s1.day = this.sectionInt(16, 16)
      this.gfs_msg.s1.hour = this.sectionInt(17, 17)
      this.gfs_msg.s1.minute = this.sectionInt(18, 18)
      this.gfs_msg.s1.second = this.sectionInt(19, 19)
      this.gfs_msg.s1.status = this.sectionInt(20, 20)
      this.gfs_msg.s1.type = this.sectionInt(21, 21)
      this.gfs_file.offset += this.gfs_msg.s1.size

      //if (this.gfs_msg.s1.size != 21) alert("TODO: 22-N Reserved")
      this.debug(this.gfs_msg.s1)
    }
  }

  private msgReadSection2() {
    this.gfs_msg.s2.offset = this.gfs_file.offset
    this.gfs_msg.s2.size = 0
    this.gfs_msg.s2.section = this.sectionInt(5, 5)
    if (this.gfs_msg.s2.section == 2) {
      this.gfs_msg.s2.offset = this.gfs_file.offset
      this.gfs_msg.s2.size = this.sectionInt(1, 4)
      this.gfs_file.offset += this.gfs_msg.s2.size
      this.debug(this.gfs_msg.s2)
    }
  }

  private gridDefTemplate3_0(): void {
    this.gfs_msg.s3.def.name = 'Latitude/Longitude'
    this.gfs_msg.s3.def.earth_shape = this.sectionInt(15, 15)
    this.gfs_msg.s3.def.scale_factor_radius = this.sectionInt(16, 16)
    this.gfs_msg.s3.def.scaled_value_radius = this.sectionInt(17, 20)
    this.gfs_msg.s3.def.scale_factor_majorx = this.sectionInt(21, 21)
    this.gfs_msg.s3.def.scaled_value_majorx = this.sectionInt(22, 25)
    this.gfs_msg.s3.def.scale_factor_minorx = this.sectionInt(26, 26)
    this.gfs_msg.s3.def.scaled_value_minorx = this.sectionInt(27, 30)
    this.gfs_msg.s3.def.Ni = this.sectionInt(31, 34)
    this.gfs_msg.s3.def.Nj = this.sectionInt(35, 38)
    this.gfs_msg.s3.def.basic_angle = this.sectionInt(39, 42)
    this.gfs_msg.s3.def.basic_angle_subdiv = this.sectionInt(43, 46)
    this.gfs_msg.s3.def.lat1 = this.sectionInt(47, 50)
    this.gfs_msg.s3.def.long1 = this.sectionInt(51, 54)
    this.gfs_msg.s3.def.res_flags = this.sectionInt(55, 55)
    this.gfs_msg.s3.def.lat2 = this.sectionInt(56, 59)
    this.gfs_msg.s3.def.long2 = this.sectionInt(60, 63)
    this.gfs_msg.s3.def.Di = this.sectionInt(64, 67)
    this.gfs_msg.s3.def.Dj = this.sectionInt(68, 71)
    this.gfs_msg.s3.def.scan_flags = this.sectionInt(72, 72)
  }

  private msgReadSection3() {
    this.gfs_msg.s3.offset = this.gfs_file.offset
    this.gfs_msg.s3.size = 0
    this.gfs_msg.s3.section = this.sectionInt(5, 5)
    if (this.gfs_msg.s2.section == 3) {
      this.gfs_msg.s3.size = this.sectionInt(1, 4)
      this.gfs_msg.s3.grid_source = this.sectionInt(6, 6)
      this.gfs_msg.s3.num_points = this.sectionInt(7, 10)
      this.gfs_msg.s3.num_octets = this.sectionInt(11, 11)
      this.gfs_msg.s3.list_num = this.sectionInt(12, 12)
      this.gfs_msg.s3.template = this.sectionInt(13, 14)

      // Pick template definition
      switch (this.gfs_msg.s3.template) {
        case 0:
          this.gridDefTemplate3_0()
          break
        default:
          console.log("Missing Grid Template")
          break
      }
      this.gfs_file.offset += this.gfs_msg.s3.size
      this.debug(this.gfs_msg.s3)
    }
  }

  private prodDefTemplate4_0(): void {
    this.gfs_msg.s4.def.name = 'Analysis or forecast at a horizontal level'
    this.gfs_msg.s4.def.param_cat = this.sectionInt(10, 10)
    this.gfs_msg.s4.def.param_num = this.sectionInt(11, 11)
    this.gfs_msg.s4.def.process_type = this.sectionInt(12, 12)
    this.gfs_msg.s4.def.process_bgnd = this.sectionInt(13, 13)
    this.gfs_msg.s4.def.process_model = this.sectionInt(14, 14)
    this.gfs_msg.s4.def.data_hrs = this.sectionInt(15, 16)
    this.gfs_msg.s4.def.data_min = this.sectionInt(17, 17)
    this.gfs_msg.s4.def.time_unit = this.sectionInt(18, 18)
    this.gfs_msg.s4.def.time_forecast = this.sectionInt(19, 22)
    this.gfs_msg.s4.def.surface1_type = this.sectionInt(23, 23)
    this.gfs_msg.s4.def.surface1_factor = this.sectionInt(24, 24)
    this.gfs_msg.s4.def.surface1_value = this.sectionInt(25, 28)
    this.gfs_msg.s4.def.surface2_type = this.sectionInt(29, 29)
    this.gfs_msg.s4.def.surface2_factor = this.sectionInt(30, 30)
    this.gfs_msg.s4.def.surface2_value = this.sectionInt(31, 34)
  }

  private prodDefTemplate4_8(): void {
    this.gfs_msg.s4.def.name = 'Avg, Accumulation, Extreme or Statistically-processed values'
    this.gfs_msg.s4.def.param_cat = this.sectionInt(10, 10)
    this.gfs_msg.s4.def.param_num = this.sectionInt(11, 11)
    this.gfs_msg.s4.def.process_type = this.sectionInt(12, 12)
    this.gfs_msg.s4.def.process_bgnd = this.sectionInt(13, 13)
    this.gfs_msg.s4.def.process_model = this.sectionInt(14, 14)
    this.gfs_msg.s4.def.data_hrs = this.sectionInt(15, 16)
    this.gfs_msg.s4.def.data_min = this.sectionInt(17, 17)
    this.gfs_msg.s4.def.time_unit = this.sectionInt(18, 18)
    this.gfs_msg.s4.def.time_forecast = this.sectionInt(19, 22)
    this.gfs_msg.s4.def.surface1_type = this.sectionInt(23, 23)
    this.gfs_msg.s4.def.surface1_factor = this.sectionInt(24, 24)
    this.gfs_msg.s4.def.surface1_value = this.sectionInt(25, 28)
    this.gfs_msg.s4.def.surface2_type = this.sectionInt(29, 29)
    this.gfs_msg.s4.def.surface2_factor = this.sectionInt(30, 30)
    this.gfs_msg.s4.def.surface2_value = this.sectionInt(31, 34)
    this.gfs_msg.s4.def.end_year = this.sectionInt(35, 36)
    this.gfs_msg.s4.def.end_month = this.sectionInt(37, 37)
    this.gfs_msg.s4.def.end_day = this.sectionInt(38, 38)
    this.gfs_msg.s4.def.end_hour = this.sectionInt(39, 39)
    this.gfs_msg.s4.def.end_minute = this.sectionInt(40, 40)
    this.gfs_msg.s4.def.end_second = this.sectionInt(41, 41)
    this.gfs_msg.s4.def.num_intervals = this.sectionInt(42, 42)
    this.gfs_msg.s4.def.num_missing_data = this.sectionInt(43, 46)
    // Need to add dynamic range specs based on num_intervals: n
    // The block below would repeat for each interval spec.
  }

  private msgReadSection4() {
    this.gfs_msg.s4.offset = this.gfs_file.offset
    this.gfs_msg.s4.size = 0
    this.gfs_msg.s4.section = this.sectionInt(5, 5)
    if (this.gfs_msg.s4.section == 4) {
      this.gfs_msg.s4.offset = this.gfs_file.offset
      this.gfs_msg.s4.size = this.sectionInt(1, 4)
      this.gfs_msg.s4.num_coords = this.sectionInt(6, 7)
      this.gfs_msg.s4.template = this.sectionInt(8, 9)

      // Since 2 templates are handled best to clear the previous
      for (const member in this.gfs_msg.s4.def) delete this.gfs_msg.s4.def[member]

      // Pick template definition
      switch (this.gfs_msg.s4.template) {
        case 0:
          this.prodDefTemplate4_0()
          break
        case 8:
          this.prodDefTemplate4_8()
          break
        default:
          console.log("#" + this.gfs_file.msg_cnt + " Missing Product Template: ", this.gfs_msg.s4.template)
          break
      }
      this.gfs_file.offset += this.gfs_msg.s4.size
      this.debug(this.gfs_msg.s4)
    }
  }

  private dataDefTemplate5_0(): void {
    this.gfs_msg.s5.def.name = 'Grid point data - simple packing'
    this.gfs_msg.s5.def.ref_value = this.sectionFloat32(12, 15)
    this.gfs_msg.s5.def.bin_scale = this.sectionInt(16, 17)
    this.gfs_msg.s5.def.dec_scale = this.sectionInt(18, 19)
    this.gfs_msg.s5.def.bits = this.sectionInt(20, 20)
    this.gfs_msg.s5.def.type = this.sectionInt(21, 21)
  }

  private msgReadSection5() {
    this.gfs_msg.s5.offset = this.gfs_file.offset
    this.gfs_msg.s5.size = 0
    this.gfs_msg.s5.section = this.sectionInt(5, 5)
    if (this.gfs_msg.s5.section == 5) {
      this.gfs_msg.s5.offset = this.gfs_file.offset
      this.gfs_msg.s5.size = this.sectionInt(1, 4)
      this.gfs_msg.s5.num_points = this.sectionInt(6, 9)
      this.gfs_msg.s5.template = this.sectionInt(10, 11)

      // Pick template definition
      switch (this.gfs_msg.s5.template) {
        case 0:
          this.dataDefTemplate5_0()
          break
        default:
          console.log("#" + this.gfs_file.msg_cnt + "Missing Data Template", this.gfs_msg.s5.template)
          break
      }
      this.gfs_file.offset += this.gfs_msg.s5.size
      this.debug(this.gfs_msg.s5)
    }
  }

  private msgReadSection6() {
    this.gfs_msg.s6.offset = this.gfs_file.offset
    this.gfs_msg.s6.size = 0
    this.gfs_msg.s6.section = this.sectionInt(5, 5)
    if (this.gfs_msg.s6.section == 6) {
      this.gfs_msg.s6.offset = this.gfs_file.offset
      this.gfs_msg.s6.size = this.sectionInt(1, 4)
      this.gfs_msg.s6.indicator = this.sectionInt(6, 6)
      if (this.gfs_msg.s6.indicator == 0) {
        this.gfs_msg.s6.bitmap = this.sectionOctet(7, this.gfs_msg.s6.size)
      }
      this.gfs_file.offset += this.gfs_msg.s6.size
      this.debug(this.gfs_msg.s6)
    }
  }

  private msgReadSection7() {
    this.gfs_msg.s7.offset = this.gfs_file.offset
    this.gfs_msg.s7.size = 0
    this.gfs_msg.s7.section = this.sectionInt(5, 5)
    if (this.gfs_msg.s7.section == 7) {
      this.gfs_msg.s7.offset = this.gfs_file.offset
      this.gfs_msg.s7.size = this.sectionInt(1, 4)
      this.gfs_msg.s7.data = this.sectionOctet(6, this.gfs_msg.s7.size)
      this.gfs_file.offset += this.gfs_msg.s7.size
      this.debug(this.gfs_msg.s7)
    }
  }

  private msgReadSection8() {
    this.gfs_msg.s8.offset = this.gfs_file.offset
    this.gfs_msg.s8.size = 0
    this.gfs_msg.s8.tag = arrayToStr(this.sectionOctet(1, 4))
    if (this.gfs_msg.s8.tag === '7777') {
      this.gfs_msg.s8.size = 4
      this.gfs_file.offset += this.gfs_msg.s8.size
      this.debug(this.gfs_msg.s8)
    }
  }

  private readGrib2Msg() {
    // Read Message Sections
    this.msgReadSection0()
    this.msgReadSection1()
    this.msgReadSection2()
    this.msgReadSection3()
    this.msgReadSection4()
    this.msgReadSection5()
    this.msgReadSection6()
    this.msgReadSection7()
    this.msgReadSection8()
  }

  // Regulation 92.9.4: Y * 10^D= R + (X1+X2) * 2^E
  private decodeSimplePacking(index: number): number {
    // Get bits from byte array
    const value = this.bitUnpack(this.gfs_msg.s7.data, this.gfs_msg.s5.def.bits!, index)

    // Decode value
    const bin_scale = (1 << this.gfs_msg.s5.def.bin_scale!)
    const dec_scale = 10 ** this.gfs_msg.s5.def.dec_scale!
    return (this.gfs_msg.s5.def.ref_value! + value * bin_scale) / dec_scale
  }

  // Upscale BMS this.fmap data since the GFS is 0.25 degrees per step
  private fmapUpscaleData(data: number[][]): void {
    // Upscaling Y pressures
    for (let y = 0; y < this.fmap.dimension.y - 1; y++) {
      for (let x = 0; x < this.fmap.dimension.x - 1; x++) {
        if ((x > 0) && (x % 2) > 0) data[y]![x] = (data[y]![x - 1]! + data[y]![x + 1]!) / 2
        if ((y > 0) && (y % 2) > 0) data[y]![x] = (data[y - 1]![x]! + data[y + 1]![x]!) / 2
      }
    }
  }

  // Decode to Memory temporary Buffer
  private decodeMsg(name: string, buf: GfsBuffer): void {

    buf.name = name
    buf.level = this.gfs_msg.s4.def.surface1_value!
    buf.data = Array(this.gfs_msg.s3.num_points)
    for (let i = 0; i < this.gfs_msg.s3.num_points; i++) buf.data[i] = this.decodeSimplePacking(i)
  }

  private transcodeMsg(name: string, src: GfsBuffer, dest: number[][]): void {
    if (src.name != name) return
    const scale_y = this.gfs_msg.s3.def.Nj! / this.fmap.dimension.y
    const scale_x = this.gfs_msg.s3.def.Ni! / this.fmap.dimension.x

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0)
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const gy = ((this.fmap.dimension.y - 1 - y) * scale_y) >> 0
        const gx = (x * scale_x) >> 0
        const i = gy * this.gfs_msg.s3.def.Ni! + gx
        data[x] = src.data[i]! * src.scale! + src.offset!

        // Exceptions should do something different but is fast
        if (dest === this.fmap.pressure) {
          if (data[x] < this.fmap.analytics.pressure_min) this.fmap.analytics.pressure_min = data[x]
          if (data[x] > this.fmap.analytics.pressure_max) this.fmap.analytics.pressure_max = data[x]
        }
        if (this.fmap.temperature) {
          if (data[x] < this.fmap.analytics.temperature_min) this.fmap.analytics.temperature_min = data[x]
          if (data[x] > this.fmap.analytics.temperature_max) this.fmap.analytics.temperature_max = data[x]
        }
      }
      dest.push(data)
    }
    this.fmapUpscaleData(dest)
  }

  private getPressureAltIndex(mb: number): number {
    let i = 0
    for (; i < this.gfsPressureAltitide.length; i++) {
      if (mb == this.gfsPressureAltitide[i]) break
    }
    return i
  }

  // DIRECTION=57.29578*(arctangent(UGRD,VGRD))+180.
  // SPEED=SQRT(UGRD*UGRD+VGRD*VGRD)
  // Where:
  //  - UGRD is the North/South wind component (North is + & South is -) and
  //  - VGRD is the East/West wind component (East is + West is - [I think...]).
  private transcodeWinds() {
    const alt = this.getPressureAltIndex(this.gfs_msg.s4.def.surface1_value!)
    if (alt == -1) return

    // Guard against mixing data
    if (this.gfs.ugrd.level != this.gfs.vgrd.level) return

    const scale_y = this.gfs_msg.s3.def.Nj! / this.fmap.dimension.y
    const scale_x = this.gfs_msg.s3.def.Ni! / this.fmap.dimension.x

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        // Calculate the sampling index
        const gy = ((this.fmap.dimension.y - 1 - y) * scale_y) >> 0
        const gx = (x * scale_x) >> 0
        const i = gy * this.gfs_msg.s3.def.Ni! + gx

        // Get the wind components
        const ugrd = this.gfs.ugrd.data[i]! * this.gfs.ugrd.scale!
        const vgrd = this.gfs.vgrd.data[i]! * this.gfs.vgrd.scale!

        // Calculate direction and speed
        const direction = 57.29578 * (Math.atan2(ugrd, vgrd)) + 180
        const speed = Math.sqrt(ugrd * ugrd + vgrd * vgrd)
        this.fmap.wind[y]![x]![alt] = {direction: direction, speed: speed}
      }
    }
  }

  private transcodeCloudCoverage() {

    // Check only levels of largers than 20000 Pa
    if (this.gfs.tcdc.level < 20000) return

    const scale_y = this.gfs_msg.s3.def.Nj! / this.fmap.dimension.y
    const scale_x = this.gfs_msg.s3.def.Ni! / this.fmap.dimension.x

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      for (let x = 0; x < this.fmap.dimension.x; x++) {

        // Calculate the sampling index
        const gy = ((this.fmap.dimension.y - 1 - y) * scale_y) >> 0
        const gx = (x * scale_x) >> 0
        const i = gy * this.gfs_msg.s3.def.Ni! + gx

        // Determine Cloud Coverage
        const coverage = Math.round(this.gfs.tcdc.data[i]! * this.gfs.tcdc.scale!) // In percentage
        if (coverage >= this.fmap.cloud.cover[y]![x]!) this.fmap.cloud.cover[y]![x] = coverage

        // Determine Cloud Size
        if (coverage > 6) {
          if (this.fmap.cloud.size[y]![x]! > 1) this.fmap.cloud.size[y]![x] = this.fmap.cloud.size[y]![x]! - 1
        }
        // Determine Cloud Type
        if (this.fmap.cloud.size[y]![x] == 1) this.fmap.cloud.type[y]![x] = 1 // TCu
      }
    }
  }

  private transcodeShowers() {
    const scale_y = this.gfs_msg.s3.def.Nj! / this.fmap.dimension.y
    const scale_x = this.gfs_msg.s3.def.Ni! / this.fmap.dimension.x

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      for (let x = 0; x < this.fmap.dimension.x; x++) {

        // Calculate the sampling index
        const gy = ((this.fmap.dimension.y - 1 - y) * scale_y) >> 0
        const gx = (x * scale_x) >> 0
        const i = gy * this.gfs_msg.s3.def.Ni! + gx

        // Determine Shower Flag
        const prate = this.gfs.prate.data[i]! * this.gfs.prate.scale! // In mm/h after scaling
        if (prate >= 1.9) {
          this.fmap.shower[y]![x] = 1
        }
      }
    }
  }

  private transcodeCloudBase() {
    const scale_y = this.gfs_msg.s3.def.Nj! / this.fmap.dimension.y
    const scale_x = this.gfs_msg.s3.def.Ni! / this.fmap.dimension.x

    // Only process CLow Convective Clouds
    // Above 9800 ft consider CLR
    if (this.gfs_msg.s4.def.surface1_type != 242) return

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      for (let x = 0; x < this.fmap.dimension.x; x++) {

        // Calculate the sampling index
        const gy = ((this.fmap.dimension.y - 1 - y) * scale_y) >> 0
        const gx = (x * scale_x) >> 0
        const i = gy * this.gfs_msg.s3.def.Ni! + gx

        this.fmap.cloud.base[y]![x] = this.altFromPRES(this.fmap.pressure[y]![x]! * 100, this.gfs.pres.data[i]!, this.fmap.temperature[y]![x]!)
      }
    }
  }

  private transcodeFogAltitude() {
    const scale_y = this.gfs_msg.s3.def.Nj! / this.fmap.dimension.y
    const scale_x = this.gfs_msg.s3.def.Ni! / this.fmap.dimension.x

    // Only process low cloud bottom layer
    if (this.gfs_msg.s4.def.surface1_type != 212) return

    for (let y = 0; y < this.fmap.dimension.y; y++) {
      for (let x = 0; x < this.fmap.dimension.x; x++) {

        // Calculate the sampling index
        const gy = ((this.fmap.dimension.y - 1 - y) * scale_y) >> 0
        const gx = (x * scale_x) >> 0
        const i = gy * this.gfs_msg.s3.def.Ni! + gx

        this.fmap.fog[y]![x] = this.altFromPRES(this.fmap.pressure[y]![x]! * 100, this.gfs.pres.data[i]!, this.fmap.temperature[y]![x]!)
      }
    }
  }

  private determineWxType() {
    for (let y = 0; y < this.fmap.dimension.y; y++) {
      for (let x = 0; x < this.fmap.dimension.x; x++) {

        const shower = this.fmap.shower[y]![x]!
        const cover = this.fmap.cloud.cover[y]![x]!
        let type = 1

        // Some basic Limits for the Type
        if (cover > 2 && shower == 0) type = 2
        if (cover > 4 && shower == 0) type = 3
        if (cover > 4 && shower == 1) type = 4
        this.fmap.type[y]![x] = type
      }
    }
  }

  private airmassDirSpd() {
    const alt = 9
    let dir = 0
    let spd = 0
    for (let y = 0; y < this.fmap.dimension.y; y++) {
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        dir += this.fmap.wind[y]![x]![alt]!.direction
        spd += this.fmap.wind[y]![x]![alt]!.speed
      }
    }
    dir /= (this.fmap.dimension.y * this.fmap.dimension.x)
    spd /= (this.fmap.dimension.y * this.fmap.dimension.x)

    this.fmap.airmass.direction = dir >> 0
    this.fmap.airmass.speed = spd / 4  // Just take 25% of the 50000 ft average speed
  }

  private forecastTime() {
    const forecast_time = this.gfs_msg.s4.def.time_forecast!
    const extra_days = (forecast_time / 24) >> 0
    const extra_hrs = (forecast_time % 24) >> 0
    const day = (this.gfs_msg.s1.day + extra_days).toFixed(0)
    const hour = padZeros((this.gfs_msg.s1.hour + extra_hrs).toFixed(0), 2)
    const minute = padZeros(this.gfs_msg.s1.minute.toFixed(0), 2)
    this.fmap.time = day + hour + minute
  }

  private getMsgType() {
    return this.gfs_msg.s4.def.param_cat! * 256 + this.gfs_msg.s4.def.param_num!
  }

  private processGrib2Msg() {
    switch (this.getMsgType()) {

      case this.gfsMsgType.PRMSL:
        if (this.gfs_msg.s4.def.surface1_value != 0) return
        this.decodeMsg('PRMSL', this.gfs.prmsl)
        this.transcodeMsg('PRMSL', this.gfs.prmsl, this.fmap.pressure)
        this.gfs.prmsl.data = []
        break

      case this.gfsMsgType.VIS:
        if (this.gfs_msg.s4.def.surface1_value != 0) return
        this.decodeMsg('VIS', this.gfs.vis)
        this.transcodeMsg('VIS', this.gfs.vis, this.fmap.visibility)
        this.gfs.vis.data = []
        break

      case this.gfsMsgType.TMP:
        if (this.gfs_msg.s4.def.surface1_value != 2) return
        this.decodeMsg('TMP', this.gfs.tmp)
        this.transcodeMsg('TMP', this.gfs.tmp, this.fmap.temperature)
        this.gfs.tmp.data = []
        break

      case this.gfsMsgType.TCDC:
        this.decodeMsg('TCDC', this.gfs.tcdc)
        this.transcodeCloudCoverage()
        this.gfs.tcdc.data = []
        break

      case this.gfsMsgType.UGRD:
        this.decodeMsg('UGRD', this.gfs.ugrd)
        break

      case this.gfsMsgType.VGRD:
        this.decodeMsg('VGRD', this.gfs.vgrd)
        this.transcodeWinds() // UGRD and VGRD come in pairs
        this.gfs.ugrd.data = []
        this.gfs.vgrd.data = []
        break

      case this.gfsMsgType.PRES:
        this.decodeMsg('PRES', this.gfs.pres)
        this.transcodeCloudBase()
        this.transcodeFogAltitude()
        this.gfs.pres.data = []
        break

      case this.gfsMsgType.PRATE:
        this.decodeMsg('PRATE', this.gfs.prate)
        this.transcodeShowers()
        this.gfs.prate.data = []
        break

      case this.gfsMsgType.APCP:
        this.decodeMsg('APCP', this.gfs.apcp)
        this.gfs.apcp.data = []
        break

      case this.gfsMsgType.ACPCP:
        this.decodeMsg('ACPCP', this.gfs.acpcp)
        this.gfs.acpcp.data = []
        break
      default:
        console.log("Warning: Unknown Message")
    }
  }

  private setFmap2D(array_2d: number[][], value: number): void {
    // Initialize values
    for (let y = 0; y < this.fmap.dimension.y; y++) array_2d.push(new Array(this.fmap.dimension.x).fill(value))
  }

  private initFmap2D(array_2d: number[][]): void {
    this.setFmap2D(array_2d, 0)
  }

  private initializeFmap(): void {
    // Start with an empty fmap
    this.fmap = createEmptyFmap()

    // Initialize fmap
    this.fmap.dimension = {x: 59, y: 59}
    this.fmap.cells = 59 * 59
    this.fmap.version = 8
    this.fmap.scaler = 1

    // Iterate over the map cells
    const altitudes = 10
    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0)
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const velocities = Array(altitudes).fill(0)
        for (let alt = 0; alt < altitudes; alt++) velocities[alt] = {direction: 0, speed: 0}
        data[x] = velocities
      }
      this.fmap.wind.push(data)
    }

    // Setup Cloud Data
    this.initFmap2D(this.fmap.cloud.base)
    this.initFmap2D(this.fmap.cloud.cover)
    this.setFmap2D(this.fmap.cloud.size, 5)
    this.initFmap2D(this.fmap.cloud.type)
    this.initFmap2D(this.fmap.shower)
    this.initFmap2D(this.fmap.fog)
    this.initFmap2D(this.fmap.type)
  }

  // Adapt to Compute Platform
  private endianness(byte_array: Uint8Array): Uint8Array {
    // Check Endianness
    const uInt32 = new Uint32Array([0x11223344])
    const uInt8 = new Uint8Array(uInt32.buffer)
    if (uInt8[0] === 0x11) return byte_array

    // On LE Swap Bytes since GFS is BE
    const len = byte_array.length
    switch (len) {
      case 2:
        this.swapBytes(byte_array, 0, 1)
        break
      case 4:
        this.swapBytes(byte_array, 0, 3)
        this.swapBytes(byte_array, 1, 2)
        break
      case 8:
        this.swapBytes(byte_array, 0, 7)
        this.swapBytes(byte_array, 1, 6)
        this.swapBytes(byte_array, 2, 5)
        this.swapBytes(byte_array, 3, 4)
        break
      default:
        break
    }
    return byte_array
  }

  // Get Temperature at standard Pressure provide hPa and returns temp in C
  private pres2Temp(pressure: number): number {
    let temp = -26.0
    for (let i = 0; i < this.gfsPressureLUT.length; i++) {
      if (Boolean((pressure: number) => pressure >= this.gfsPressureLUT[i]!)) {
        temp = this.gfsTemperatureLUT[i]!
        break
      }
    }
    return temp
  }

  // prmsl, press in Pa
  private altFromPRES(prmsl: number, pres: number, surf_temp: number): number {
    // Physics Constants
    const R = 8.31432   // Gas constant (N x m) / (mol x K)
    const M = 0.0289644 // kg/mol
    const g = 9.80665   //  m/s^2
    const st = 15.0      // Standard Temp C.

    // Lookup Temperature from standard atmosphere
    let T = this.pres2Temp(pres / 100) + 273.15 // Kelvin
    T = T + (15 - surf_temp)

    // Determine Cloud Base
    // pres = prmsl e ^(-gMh / RT)
    // h = ln(P/P0) RT / -gM
    let alt = (Math.log(pres / prmsl) * R * T) / (-g * M)
    alt *= 3.28084 // Make ft

    return alt
  }


  // Bit unpack for 9 to 16 bits
  // Array a, bits bs and index i
  private bitUnpack(a: Uint8Array, bs: number, i: number): number {
    const mb = (1 << bs) - 1 // mask
    const sb = i * bs        // Start bit
    const eb = sb + bs       // End bit
    const ms = 8 - (eb % 8)  // Shift to mask area
    const sy = (sb / 8) >> 0 // Start Byte
    const ey = (eb / 8) >> 0 // End Byte
    let res = 0

    for (let n = sy; n <= ey; n++) res = res * 256 + a[n]!
    res = (res >> ms) & mb

    return res
  }

  private swapBytes(byte_array: Uint8Array, s: number, d: number): void {
    const tmp = byte_array[s]!
    byte_array[s] = byte_array[d]!
    byte_array[d] = tmp
  }

  private debug(...args: unknown[]): void {
    if (GFS_DEBUG) args.forEach(arg => console.log(arg))
  }
}
