import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {WeatherManager} from "@/scripts/WeatherManager.ts";
import type {Fmap} from "@/model/fmap.ts";
import {watch} from "vue";

export class CloudsOverlay extends BaseOverlay {

  private readonly weatherMgr: WeatherManager;
  private weatherData: Fmap | null = null;

  constructor(weatherMgr: WeatherManager) {
    super();
    this.weatherMgr = weatherMgr;
  }

  public init(): void {

    this.weatherMgr.onWeatherEvent((data: Fmap) => {
      this.weatherData = data;
    });

    watch(() => this.settings.viz.wx, () => {
      this.redraw();
    });
  }

  public override isEnabled(): boolean {
    return this.settings.viz.wx && true;
  }

  private colorCache = new Map<number, string>();

  private getCloudLayerAltitudeColor(altitudeFeet: number): string {
    // Round to nearest integer (or step) to maximize cache hit rate
    const key = Math.round(Math.max(1000, Math.min(30000, altitudeFeet)));

    const cachedColor = this.colorCache.get(key);
    if (cachedColor !== undefined) {
      return cachedColor;
    }

    let color: string;

    if (key <= 15000) {
      // 1000 red -> 15000 yellow
      const t = (key - 1000) / (15000 - 1000);
      const g = Math.round(t * 255);
      color = `rgb(255, ${g}, 0)`;
    } else {
      // 15000 yellow -> 30000 green
      const t = (key - 15000) / (30000 - 15000);
      const r = Math.round((1 - t) * 255);
      color = `rgb(${r}, 255, 0)`;
    }

    this.colorCache.set(key, color);
    return color;
  }

  public onDraw(cnv: Canvas): void {
    if (!this.weatherData?.cloud) return
    const data = this.weatherData.cloud
    const sz = this.global.map!.pixels / 59
    const rad = (sz - 10) / 2
    this.drawWorldInScreenSpace(() => {
      cnv.context.globalAlpha = 0.3
      for (let x = 0; x < 59; x++) {
        for (let y = 0; y < 59; y++) {
          const cl = data.base[x]?.[y]
          if (!cl) continue
          const tp = data.cover[x]?.[y]
          if (!tp) continue
          const csf = tp / 10
          if (csf < 0.11) continue
          const col = this.getCloudLayerAltitudeColor(cl)
          cnv.context.beginPath();
          cnv.context.arc(x * sz + sz / 2, y * sz + sz / 2, rad * csf, 0, 2 * Math.PI);
          cnv.context.fillStyle = col
          cnv.context.fill()
        }
      }
      cnv.context.globalAlpha = 1
    })
  }
}
