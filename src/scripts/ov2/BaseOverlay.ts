import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";
import type {Mode} from "@/model/mode.ts";
import type {Point} from "@/model/base.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";

export interface Overlay {
  isEnabled(): boolean

  getActiveMode(): Mode | undefined

  onDraw(cnv: Canvas): void

  onPointerDown?(e: PointerEvent): void

  onPointerMove?(e: PointerEvent): void

  onPointerUp?(e: PointerEvent): void

  onHoverHotspot?(hotspots: Hotspot[]): void

  onHoverOwnHotspot?(hotspots: Hotspot[]): void

  onClick?(e: PointerEvent): void

  onClickHotspot?(hotspots: Hotspot[]): void

  onClickOwnHotspot?(hotspots: Hotspot[]): void

  providesHotspots?(): Hotspot[]
}

export abstract class BaseOverlay implements Overlay {

  protected global = useGlobalStore()
  protected settings = useSettingsStore()

  protected readonly manager: OverlayManager
  private activeMode: Mode | undefined = undefined
  private enabled = true

  constructor(manager: OverlayManager, activeMode?: Mode) {
    manager.registerOverlay(this)
    this.manager = manager
    this.activeMode = activeMode
  }

  public setEnabled(enabled: boolean): void {
    console.log(`setting overlay '${this.constructor.name}' to ${enabled ? 'enabled' : 'disabled'}`)
    this.enabled = enabled
    this.redraw()
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public getActiveMode(): Mode | undefined {
    return this.activeMode
  }

  public abstract onDraw(cnv: Canvas): void

  protected redraw(): void {
    this.manager.redraw()
  }

  protected fromCnv(pt: Point, cnv?: Canvas): Point {
    if (!cnv) cnv = this.manager.getCanvas()
    return {x: pt.x / cnv.scale + cnv.offset.x, y: pt.y / cnv.scale + cnv.offset.y}
  }

  protected toCnv(pt: Point, cnv?: Canvas): Point {
    if (!cnv) cnv = this.manager.getCanvas()
    return {x: (pt.x - cnv.offset.x) * cnv.scale, y: (pt.y - cnv.offset.y) * cnv.scale}
  }

}
