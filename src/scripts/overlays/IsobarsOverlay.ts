import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts"
import type {Canvas} from "@/scripts/overlays/Canvas.ts"
import type {WeatherManager} from "@/scripts/WeatherManager.ts"
import type {Fmap} from "@/model/fmap.ts"
import {Conrec} from "@/scripts/Conrec.ts"
import {watch} from "vue"

export class IsobarsOverlay extends BaseOverlay {
  private readonly weatherMgr: WeatherManager

  private weatherData: Fmap | null = null
  private offlineCanvas: HTMLCanvasElement | null = null

  private gridSizeX: number = 0
  private gridSizeY: number = 0
  private tileSizeX: number = 0
  private tileSizeY: number = 0

  constructor(weatherMgr: WeatherManager) {
    super()
    this.weatherMgr = weatherMgr
  }

  public init(): void {
    this.weatherMgr.onWeatherEvent((data: Fmap) => {
      this.weatherData = data
      this.gridSizeX = this.weatherData.dimension.x
      this.gridSizeY = this.weatherData.dimension.y
      if (this.global.map) {
        this.tileSizeX = this.global.map.pixels / this.gridSizeX
        this.tileSizeY = this.global.map.pixels / this.gridSizeY
      }
      this.regenerateIsobarsCache()
    })

    watch(() => this.settings.viz.wx, () => {
      this.redraw()
    })

    watch(() => this.settings.settings.weather.wxLayers.isobaric, () => {
      this.redraw()
    })

    watch(() => this.settings.settings.weather.metric, () => {
      this.regenerateIsobarsCache()
      this.redraw()
    })
  }

  public override isEnabled(): boolean {
    return this.settings.viz.wx && this.settings.settings.weather.wxLayers.isobaric
  }

  private regenerateIsobarsCache(): void {
    if (!this.weatherData?.pressure || this.weatherData.pressure.length === 0 || !this.global.map) {
      this.offlineCanvas = null
      return
    }

    const width = this.global.map.pixels
    const height = this.global.map.pixels
    if (width <= 0 || height <= 0) return

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

    if (this.gridSizeX <= 0 || this.gridSizeY <= 0) {
      this.gridSizeX = this.weatherData.dimension.x
      this.gridSizeY = this.weatherData.dimension.y
    }
    this.tileSizeX = width / this.gridSizeX
    this.tileSizeY = height / this.gridSizeY

    const ilb = 0
    const iub = this.gridSizeY - 1
    const jlb = 0
    const jub = this.gridSizeX - 1

    if (iub <= ilb || jub <= jlb) return

    const x: number[] = []
    for (let i = ilb; i <= iub; i++) {
      x.push(i)
    }

    const y: number[] = []
    for (let j = jlb; j <= jub; j++) {
      y.push(j)
    }

    const minPressure = Math.floor(this.weatherData.analytics.pressure_min)
    const maxPressure = Math.floor(this.weatherData.analytics.pressure_max)
    const count = maxPressure - minPressure
    if (count <= 0) return

    const pressures: number[] = new Array(count).fill(0)
    for (let i = 0; i < count; i++) {
      pressures[i] = minPressure + i
    }

    ctx.strokeStyle = "#383b79"
    ctx.lineWidth = 4
    ctx.font = "18px serif"

    let lastLevel = ""

    const isMetric = this.settings.settings.weather.metric

    const drawContours = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      l: number
    ): void => {
      ctx.beginPath()
      ctx.moveTo(y1 * this.tileSizeX, x1 * this.tileSizeY)
      ctx.lineTo(y2 * this.tileSizeX, x2 * this.tileSizeY)
      ctx.stroke()

      const levelStr = !isMetric ? (l * 0.0295301).toFixed(2) : l.toString()
      if (lastLevel !== levelStr) {
        ctx.fillStyle = "#000000"
        ctx.fillText(levelStr, y1 * this.tileSizeX + 5 + 2, x1 * this.tileSizeY + 2)
        ctx.fillStyle = "#ffffff"
        ctx.fillText(levelStr, y1 * this.tileSizeX + 5, x1 * this.tileSizeY)
        lastLevel = levelStr
      }
    }

    const c = new Conrec(drawContours)
    c.contour(this.weatherData.pressure, ilb, iub, jlb, jub, x, y, pressures.length, pressures)
  }

  public onDraw(cnv: Canvas): void {
    if (!this.weatherData?.pressure || this.weatherData.pressure.length === 0) return

    if (!this.offlineCanvas) {
      this.regenerateIsobarsCache()
    }

    if (!this.offlineCanvas) return

    this.drawWorldInScreenSpace(() => {
      cnv.context.drawImage(this.offlineCanvas!, 0, 0)
    })
  }
}
