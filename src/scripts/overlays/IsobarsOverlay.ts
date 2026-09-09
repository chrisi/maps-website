import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts"
import type {Canvas} from "@/scripts/overlays/Canvas.ts"
import type {WeatherManager} from "@/scripts/WeatherManager.ts"
import type {Fmap} from "@/model/fmap.ts"
import type {Point2D} from "@/model/base.ts"
import {Conrec} from "@/scripts/Conrec.ts"
import {addSplineToPath, douglasPeucker} from "@/scripts/draw/spline.ts"
import {watch} from "vue"

interface IsobarLabel {
  level: number
  x: number
  y: number
}

export class IsobarsOverlay extends BaseOverlay {
  private readonly weatherMgr: WeatherManager

  private weatherData: Fmap | null = null
  private isobarsPath: Path2D | null = null
  private labels: IsobarLabel[] = []

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
      this.generateIsobarsPath()
      this.redraw()
    })

    watch(() => this.settings.viz.wx, () => {
      this.redraw()
    })

    watch(() => this.settings.settings.weather.wxLayers.isobaric, () => {
      this.redraw()
    })

    watch(() => this.settings.settings.weather.metric, () => {
      this.redraw()
    })
  }

  public override isEnabled(): boolean {
    return this.settings.viz.wx && this.settings.settings.weather.wxLayers.isobaric
  }

  private generateIsobarsPath(): void {
    if (!this.weatherData?.pressure || this.weatherData.pressure.length === 0 || !this.global.map) {
      this.isobarsPath = null
      this.labels = []
      return
    }

    const width = this.global.map.pixels
    const height = this.global.map.pixels
    if (width <= 0 || height <= 0) {
      this.isobarsPath = null
      this.labels = []
      return
    }

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

    if (iub <= ilb || jub <= jlb) {
      this.isobarsPath = null
      this.labels = []
      return
    }

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
    if (count <= 0) {
      this.isobarsPath = null
      this.labels = []
      return
    }

    const pressures: number[] = new Array(count).fill(0)
    for (let i = 0; i < count; i++) {
      pressures[i] = minPressure + i
    }

    const c = new Conrec()
    c.contour(this.weatherData.pressure, ilb, iub, jlb, jub, x, y, pressures.length, pressures)
    const contours = c.contourList()

    const path = new Path2D()
    const labels: IsobarLabel[] = []
    let lastLevel = -1

    for (const contour of contours) {
      if (contour.length < 2) continue

      const worldPoints: Point2D[] = contour.map(p => ({
        x: p.y * this.tileSizeX,
        y: p.x * this.tileSizeY
      }))

      const simplified = douglasPeucker(worldPoints, 20)
      if (simplified.length < 2) continue

      addSplineToPath(path, simplified)

      if (lastLevel !== contour.level) {
        labels.push({
          level: contour.level,
          x: simplified[0]!.x + 5,
          y: simplified[0]!.y
        })
        lastLevel = contour.level
      }
    }
    this.isobarsPath = path
    this.labels = labels
  }

  public onDraw(cnv: Canvas): void {
    if (!this.weatherData?.pressure || this.weatherData.pressure.length === 0 || !this.global.map) return

    if (!this.isobarsPath) {
      this.generateIsobarsPath()
    }

    if (!this.isobarsPath) return

    this.drawWorldInScreenSpace(() => {
      const ctx = cnv.context
      ctx.strokeStyle = "#383b79"
      ctx.lineWidth = 4
      ctx.stroke(this.isobarsPath!)

      ctx.font = "18px serif"
      const isMetric = this.settings.settings.weather.metric

      for (const label of this.labels) {
        const levelStr = !isMetric ? (label.level * 0.0295301).toFixed(2) : label.level.toString()
        ctx.fillStyle = "#000000"
        ctx.fillText(levelStr, label.x + 2, label.y + 2)
        ctx.fillStyle = "#ffffff"
        ctx.fillText(levelStr, label.x, label.y)
      }
    })
  }
}
