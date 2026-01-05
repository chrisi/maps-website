import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";
import type {Point} from "@/model/base.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";

export interface Overlay {
  isActive(): boolean

  onDraw(cnv: Canvas): void

  onPointerDown?(e: PointerEvent): void

  onPointerMove?(e: PointerEvent): void

  onPointerUp?(e: PointerEvent): void

  onHoverHotspot?(hotspots: Hotspot[]): void

  onClickHotspot?(hotspots: Hotspot[]): void

  providesHotspots?(): Hotspot[]
}

export abstract class BaseOverlay implements Overlay {

  protected global = useGlobalStore()
  protected settings = useSettingsStore()

  protected readonly manager: OverlayManager

  private active = true

  constructor(manager: OverlayManager) {
    manager.registerOverlay(this)
    this.manager = manager
  }

  public setActive(active: boolean): void {
    console.log(`setting overlay '${this.constructor.name}' to ${active ? 'active' : 'inactive'}`)
    this.active = active
    this.redraw()
  }

  public isActive(): boolean {
    return this.active
  }

  public abstract onDraw(cnv: Canvas): void

  protected redraw(): void {
    this.manager.redraw()
  }

  // protected getCanvas(): Canvas {
  //   return this.manager.getCanvas()
  // }

  protected fromCnv(pt: Point, cnv?: Canvas): Point {
    if (!cnv) cnv = this.manager.getCanvas()
    return {x: pt.x / cnv.scale + cnv.offset.x, y: pt.y / cnv.scale + cnv.offset.y}
  }

  protected toCnv(pt: Point, cnv?: Canvas): Point {
    if (!cnv) cnv = this.manager.getCanvas()
    return {x: (pt.x - cnv.offset.x) * cnv.scale, y: (pt.y - cnv.offset.y) * cnv.scale}
  }

}
