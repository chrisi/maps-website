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
      this.cloudRad = Math.min(this.tileSizeX, this.tileSizeY) * 2
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

    const data = this.weatherData.cloud
    for (let x = 0; x < this.gridSizeX; x++) {
      for (let y = 0; y < this.gridSizeY; y++) {
        const base = data.base[y]?.[x]
        if (!base) continue
        const cover = data.cover[y]?.[x]
        if (!cover || cover < 2) continue
        const fac = cover / MAX_CLOUD_COVER * this.cloudSizeFactor
        const col = this.getCloudBaseAltitudeColor(base)
        const cx = x * this.tileSizeX + this.tileSizeX / 2
        const cy = y * this.tileSizeY + this.tileSizeY / 2
        const rad = this.cloudRad * fac

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        gradient.addColorStop(0, col.replace("rgb", "rgba").replace(")", ", 0.2)"))
        gradient.addColorStop(1, col.replace("rgb", "rgba").replace(")", ", 0)"))

        ctx.beginPath()
        ctx.arc(cx, cy, rad, 0, 2 * Math.PI)
        ctx.fillStyle = gradient
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

    if (this.settings.settings.weather.colorCloudBase) {
      this.drawLegend(cnv)
    }
  }

  private drawLegend(cnv: Canvas): void {
    const ctx = cnv.context
    ctx.save()

    const padX = 10
    const padY = 8
    const rowHeight = 17
    const boxWidth = 14
    const boxHeight = 10
    const boxGap = 8
    const titleGap = 6
    const radius = 6

    const items: { label: string, color: string }[] = []
    for (const [key, color] of this.cloudAltColorMap) {
      const label = key >= 20000 ? "> 9,000 ft" : `≤ ${key.toLocaleString()} ft`
      items.push({ label, color })
    }

    ctx.font = "bold 11px sans-serif"
    const title = "Cloud Base"
    let maxContentWidth = ctx.measureText(title).width

    ctx.font = "11px sans-serif"
    for (const item of items) {
      const textWidth = ctx.measureText(item.label).width
      maxContentWidth = Math.max(maxContentWidth, boxWidth + boxGap + textWidth)
    }

    const legendWidth = maxContentWidth + padX * 2
    const legendHeight = padY * 2 + 14 + titleGap + items.length * rowHeight

    const canvasHeight = ctx.canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 0) || ctx.canvas.height
    const x = 16
    const y = Math.max(16, canvasHeight - legendHeight - 16)

    // Draw darkened background with rounded corners
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)"
    if (ctx.roundRect) {
      ctx.beginPath()
      ctx.roundRect(x, y, legendWidth, legendHeight, radius)
      ctx.fill()
    } else {
      ctx.fillRect(x, y, legendWidth, legendHeight)
    }

    // Draw title
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 11px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(title, x + padX, y + padY)

    // Draw items
    ctx.font = "11px sans-serif"
    let currentY = y + padY + 14 + titleGap

    for (const item of items) {
      const boxY = currentY + (rowHeight - boxHeight) / 2
      const boxX = x + padX

      ctx.fillStyle = item.color
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight)

      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
      ctx.lineWidth = 1
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(item.label, boxX + boxWidth + boxGap, currentY + rowHeight / 2)

      currentY += rowHeight
    }

    ctx.restore()
  }
}
