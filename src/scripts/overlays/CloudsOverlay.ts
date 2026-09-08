import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts"
import type {Canvas} from "@/scripts/overlays/Canvas.ts"
import type {WeatherManager} from "@/scripts/WeatherManager.ts"
import type {Fmap} from "@/model/fmap.ts"
import {watch} from "vue"

const MAX_CLOUD_COVER = 13

export class CloudsOverlay extends BaseOverlay {

  private readonly cloudAltColorMap = new Map<number, string>()
  private readonly weatherMgr: WeatherManager

  private baseOpacity: number = 0.7
  private blurFactor: number = 0.8
  private cloudSizeFactor: number = 1.8

  private weatherData: Fmap | null = null
  private offlineCanvas: HTMLCanvasElement | null = null

  private gridSizeX: number = 0
  private gridSizeY: number = 0
  private tileSizeX: number = 0
  private tileSizeY: number = 0
  private cloudRad: number = 0

  constructor(weatherMgr: WeatherManager) {
    super()
    this.weatherMgr = weatherMgr
    this.cloudAltColorMap = new Map<number, string>([
      [1000, "rgb(255, 0, 0)"],
      [2000, "rgb(255, 100, 60)"],
      [3000, "rgb(255, 165, 0)"],
      [4000, "rgb(255, 255, 0)"],
      [5000, "rgb(0, 128, 0)"],
      [6000, "rgb(0, 200, 0)"],
      [7000, "rgb(144, 238, 144)"],
      [8000, "rgb(80, 100, 255)"],
      [9000, "rgb(100, 165, 255)"],
      [20000, "rgb(255, 255, 255)"],
    ])
  }

  public init(): void {

    this.weatherMgr.onWeatherEvent((data: Fmap) => {
      this.weatherData = data
      this.gridSizeX = this.weatherData.dimension.x
      this.gridSizeY = this.weatherData.dimension.y
      this.tileSizeX = this.global.map!.pixels / this.gridSizeX
      this.tileSizeY = this.global.map!.pixels / this.gridSizeY
      this.cloudRad = Math.min(this.tileSizeX, this.tileSizeY) / 2
      this.regenerateCloudCache()
    })

    watch(() => this.settings.viz.wx, () => {
      this.redraw();
    })

    watch(() => this.settings.settings.weather.wxLayers.clouds, () => {
      this.redraw();
    })

    watch(() => this.settings.settings.weather.colorCloudBase, () => {
      this.regenerateCloudCache();
      this.redraw();
    })
  }

  public override isEnabled(): boolean {
    return this.settings.viz.wx && this.settings.settings.weather.wxLayers.clouds;
  }

  private getCloudBaseAltitudeColor(altitudeFeet: number): string {
    if (!this.settings.settings.weather.colorCloudBase)
      return "rgb(255, 255, 255)"
    for (const [key, value] of this.cloudAltColorMap) {
      if (altitudeFeet <= key) {
        return value
      }
    }
    return "rgb(255,255, 255)"
  }

  private regenerateCloudCache(): void {
    if (!this.weatherData?.cloud || !this.global.map) {
      this.offlineCanvas = null
      return
    }

    const width = this.global.map.pixels
    const height = this.global.map.pixels
    if (width <= 0 || height <= 0) return;

    if (!this.offlineCanvas) {
      if (typeof document !== "undefined") {
        this.offlineCanvas = document.createElement("canvas")
      }
    }
    if (!this.offlineCanvas) return

    this.offlineCanvas.width = width
    this.offlineCanvas.height = height

    const ctx = this.offlineCanvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.globalAlpha = this.baseOpacity
    ctx.filter = "blur(" + Math.max(this.tileSizeX, this.tileSizeY) * this.blurFactor + "px)"

    const data = this.weatherData.cloud
    for (let x = 0; x < this.gridSizeX; x++) {
      for (let y = 0; y < this.gridSizeY; y++) {
        const base = data.base[y]?.[x]
        if (!base) continue
        const cover = data.cover[y]?.[x]
        if (!cover || cover < 2) continue
        const fac = cover / MAX_CLOUD_COVER * this.cloudSizeFactor
        const col = this.getCloudBaseAltitudeColor(base)
        ctx.beginPath()
        ctx.arc(
          x * this.tileSizeX + this.tileSizeX / 2,
          y * this.tileSizeY + this.tileSizeY / 2,
          this.cloudRad * fac,
          0,
          2 * Math.PI
        )
        ctx.fillStyle = col
        ctx.fill()
      }
    }
    ctx.restore()
  }

  public onDraw(cnv: Canvas): void {
    if (!this.weatherData?.cloud) return

    if (!this.offlineCanvas) {
      this.regenerateCloudCache()
    }

    if (!this.offlineCanvas) return

    this.drawWorldInScreenSpace(() => {
      cnv.context.drawImage(this.offlineCanvas!, 0, 0)
    })
  }
}
