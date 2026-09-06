import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import {WindParticles} from "@/scripts/WindParticles.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {WeatherManager} from "@/scripts/WeatherManager.ts";
import type {Fmap} from "@/model/fmap.ts";
import {watch} from "vue";

export class WindParticlesOverlay extends BaseOverlay {

  private windParticles: WindParticles | null = null;
  private animationLoopId: number | null = null;
  private lastAnimationFrameTime: number = 0;
  private animationFrameInterval: number = 1000 / 60;

  private readonly weatherMgr: WeatherManager;

  constructor(weatherMgr: WeatherManager) {
    super();
    this.weatherMgr = weatherMgr;
  }

  public setFps(fps: number): void {
    const safeFps = Math.max(1, fps);
    this.animationFrameInterval = 1000 / safeFps;
  }

  public init(): void {
    this.windParticles = new WindParticles({x: this.global.map!.pixels, y: this.global.map!.pixels});

    this.weatherMgr.onWeatherEvent((data: Fmap) => {
      this.windParticles!.setWeatherData(data);
    });
    this.setFps(30);

    watch(() => this.settings.viz.wx, () => {
      this.updateAnimationLoop();
      this.redraw();
    });

    this.windParticles.start();
    this.updateAnimationLoop();
  }

  public override isEnabled(): boolean {
    return this.settings.viz.wx && super.isEnabled();
  }

  public override setEnabled(enabled: boolean): void {
    super.setEnabled(enabled);
    this.updateAnimationLoop();
    this.redraw();
  }

  public onDraw(cnv: Canvas): void {
    if (!this.isEnabled() || !this.windParticles) return;
    this.windParticles!.draw(cnv.context);
    this.drawWorldInScreenSpace(() => {
      this.windParticles!.draw(cnv.context);///*cnv.scale*/
    }, cnv);
  }

  private animationLoop = (timestamp?: number): void => {
    // Only continue if wind particles are active
    if (this.isEnabled() && this.windParticles && this.windParticles.isRunning) {
      if (!timestamp) timestamp = performance.now();

      // Throttle rendering to reduce CPU usage on large maps
      if (!this.lastAnimationFrameTime || (timestamp - this.lastAnimationFrameTime) >= this.animationFrameInterval) {
        this.lastAnimationFrameTime = timestamp;

        try {
          const cnv = this.getCanvas();
          const visX = cnv.offset.x;
          const visY = cnv.offset.y;
          const visW = window.innerWidth / cnv.scale;
          const visH = window.innerHeight / cnv.scale;
          this.windParticles.setViewport(visX, visY, visW, visH);
          this.windParticles.setZoom(cnv.scale, false);
        } catch {
          console.warn("canvas not yet ready")
        }

        this.windParticles.step();
        this.redraw();
      }

      // Continue the animation loop
      this.animationLoopId = requestAnimationFrame(this.animationLoop);
    } else {
      // Stop animation loop if wind particles are not active
      if (this.animationLoopId) {
        cancelAnimationFrame(this.animationLoopId);
        this.animationLoopId = null;
      }
      this.lastAnimationFrameTime = 0;
    }
  };

  public updateAnimationLoop(): void {
    if (this.isEnabled() && this.windParticles && this.windParticles.isRunning) {
      // Start animation loop if not already running
      if (!this.animationLoopId) {
        this.animationLoopId = requestAnimationFrame(this.animationLoop);
      }
    } else {
      // Stop animation loop
      if (this.animationLoopId) {
        cancelAnimationFrame(this.animationLoopId);
        this.animationLoopId = null;
      }
      this.lastAnimationFrameTime = 0;
    }
  }

  public setAltitude(altitudeIndex: number): void {
    this.windParticles?.setAltitude(altitudeIndex);
    this.redraw();
  }

  private createEmptyFmap(): Fmap {
    return {
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
      cloud: {base: [], cover: [], size: [], type: []},
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
  }
}
