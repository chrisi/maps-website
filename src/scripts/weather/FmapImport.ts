import {createEmptyFmap, type Fmap} from "@/model/fmap.ts"

// Version dependent offsets (in 32bit words) of the optional data blocks
const data_offset = {
  shower: [0, 0, 0, 0, 0, 0, 0, 0, 0, 93998],
  visibility: [0, 0, 0, 0, 0, 93998, 93998, 93998, 97479],
  fog: [0, 0, 0, 0, 0, 0, 0, 0, 0, 100960],
};

type TypedView = Int32Array | Float32Array;

// Converts a BMS .fmap binary into an Fmap
export class FmapImport {

  private fmap: Fmap = createEmptyFmap();

  // Process the .fmap binary buffer
  //TODO: check filename to time
  public import(buffer: ArrayBuffer, filename: string): Fmap {
    this.fmap = createEmptyFmap();

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

    return this.fmap;
  }

  // Read a [y][x] grid starting at the given offset
  private readGrid(view: TypedView, offset: number, onValue?: (value: number) => void): number[][] {
    const grid: number[][] = [];
    for (let y = 0; y < this.fmap.dimension.y; y++) {
      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {
        const i = y * this.fmap.dimension.x + x;
        data[x] = view[offset + i];
        onValue?.(data[x]);
      }
      grid.push(data);
    }
    return grid;
  }

  private readMapInfo(buffer: ArrayBuffer) {
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
  private readWeatherType(buffer: ArrayBuffer) {
    this.fmap.type = this.readGrid(new Int32Array(buffer), 11);
  }

  // Read the Atmospheric Pressure in mb / hPa
  private readAtmosphericPressure(buffer: ArrayBuffer) {
    const analytics = this.fmap.analytics;
    this.fmap.pressure = this.readGrid(new Float32Array(buffer), 3492, value => {
      if (value < analytics.pressure_min) analytics.pressure_min = value;
      if (value > analytics.pressure_max) analytics.pressure_max = value;
    });
  }

  // Read the Surface temperature in Celsius
  private readSurfaceTemperature(buffer: ArrayBuffer) {
    const analytics = this.fmap.analytics;
    this.fmap.temperature = this.readGrid(new Float32Array(buffer), 6973, value => {
      if (value < analytics.temperature_min) analytics.temperature_min = value;
      if (value > analytics.temperature_max) analytics.temperature_max = value;
    });
  }

  // Wind speed and direction for 10 altitudes:
  // 0ft, 3000ft, 6000ft, 9000ft, 12,000ft,
  // 18,000ft, 24,000ft, 30,000ft,
  // 40,000ft, 50,000ft
  private readWindVelocities(buffer: ArrayBuffer) {

    const magnitude_offset = 10454;
    const direction_offset = 45264;
    const altitudes = 10;

    const winds = new Float32Array(buffer);

    // Iterate over the map cells
    for (let y = 0; y < this.fmap.dimension.y; y++) {

      const data = Array(this.fmap.dimension.x).fill(0);
      for (let x = 0; x < this.fmap.dimension.x; x++) {

        const velocities = Array(altitudes).fill(0);
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
  private readCloudBase(buffer: ArrayBuffer) {
    this.fmap.cloud.base = this.readGrid(new Float32Array(buffer), 80074);
  }

  // Read Cloud Cover Data
  // (1: FEW, 5: SCT, 9: BKN, 13: OVC)
  // Weather Type Poor and Inclement should be minimum BKN.
  private readCloudCover(buffer: ArrayBuffer) {
    this.fmap.cloud.cover = this.readGrid(new Int32Array(buffer), 83555);
  }

  // Read Cloud Size (0 Largest ... 5 Smallest)
  private readCloudSize(buffer: ArrayBuffer) {
    this.fmap.cloud.size = this.readGrid(new Float32Array(buffer), 87036);
  }

  // Read Cloud Type
  // Towering Cumulus (1: Yes, 0: No)
  private readCloudType(buffer: ArrayBuffer) {
    this.fmap.cloud.type = this.readGrid(new Int32Array(buffer), 90517);
  }

  // Read Shower Data
  // Showers (1: Yes, 0: No)
  private readShowerdata(buffer: ArrayBuffer) {
    const offset = data_offset.shower[this.fmap.version] ?? 0; // (version 8 only)
    if (offset == 0) {
      this.fmap.shower = Array(this.fmap.cells).fill(0);
      return;
    }
    this.fmap.shower = this.readGrid(new Int32Array(buffer), offset);
  }

  // Read Visibility 0 ... 60 km in Float
  private readVisibility(buffer: ArrayBuffer) {
    const offset = data_offset.visibility[this.fmap.version] ?? 0; // Visibility LUT
    if (offset == 0) return;
    this.fmap.visibility = this.readGrid(new Float32Array(buffer), offset);
  }

  // Read Fog altitude level (in Feet Float)
  private readFog(buffer: ArrayBuffer) {
    const offset = data_offset.fog[this.fmap.version] ?? 0; // Version 8 only;
    if (offset == 0) {
      this.fmap.fog = Array(this.fmap.cells).fill(0);
      return;
    }
    this.fmap.fog = this.readGrid(new Float32Array(buffer), offset);
  }
}
