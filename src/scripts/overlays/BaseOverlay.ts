import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {OverlayManager} from "@/scripts/overlays/OverlayManager.ts";
import {type OverlayMode} from "@/model/mode.ts";
import type {Point} from "@/model/base.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import type {ImcsClient} from "@/scripts/ImcsClient.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";

export interface Overlay {
  setOverlayManager(manager: OverlayManager): void

  setImcsClient(imcsClient: ImcsClient): void

  init?(): void

  // is the overlay enabled?
  // if false, overlay will not be drawn and no pointer events will be forwarded to it.
  isEnabled(): boolean

  // is the overlay active in the current mode?
  // if false, no pointer events will be forwarded to it but it will still be drawn.
  isActive(mode: OverlayMode): boolean

  onDraw(cnv: Canvas): void

  onPointerDown?(e: PointerEvent, ownHotspots: Hotspot[]): void

  onPointerUp?(e: PointerEvent, ownHotspots: Hotspot[], isClick: boolean): void

  onPointerMove?(e: PointerEvent, ownHotspots: Hotspot[]): void

  onLongPress?(e: PointerEvent, ownHotspots: Hotspot[]): void

  onHoverHotspot?(hotspots: Hotspot[], e: PointerEvent): void

  onHoverOwnHotspot?(ownHotspots: Hotspot[], e: PointerEvent): void

  onClick?(e: PointerEvent, hotspots: Hotspot[]): void

  onClickHotspot?(hotspots: Hotspot[], e: PointerEvent): void

  onClickOwnHotspot?(hotspots: Hotspot[], e: PointerEvent): void

  providesHotspots?(): Hotspot[]

  setHotspots(hotspots: Hotspot[]): void

  getHotspots(): Hotspot[]
}

export abstract class BaseOverlay implements Overlay {

  protected global = useGlobalStore()
  protected settings = useSettingsStore()

  protected manager: OverlayManager | undefined
  protected imcsClient: ImcsClient | undefined
  private hotspots: Hotspot[] = []
  private enabled = true

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.redraw()
  }

  public setOverlayManager(manager: OverlayManager): void {
    this.manager = manager
  }

  public setImcsClient(imcsClient: ImcsClient): void {
    this.imcsClient = imcsClient
  }

  protected getOverlayManager(): OverlayManager {
    if (!this.manager) throw new Error("OverlayManager not set")
    return this.manager
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public isActive(mode: OverlayMode): boolean {
    return true
  }

  public abstract onDraw(cnv: Canvas): void

  protected redraw(): void {
    this.manager!.redraw()
  }

  protected fromCnv(pt: Point, cnv?: Canvas): Point {
    if (!cnv) cnv = this.manager!.getCanvas()
    return {x: pt.x / cnv.scale + cnv.offset.x, y: pt.y / cnv.scale + cnv.offset.y}
  }

  protected toCnv(pt: Point, cnv?: Canvas): Point {
    if (!cnv) cnv = this.manager!.getCanvas()
    return {x: (pt.x - cnv.offset.x) * cnv.scale, y: (pt.y - cnv.offset.y) * cnv.scale}
  }

  protected getCanvas(): Canvas {
    return this.manager!.getCanvas()
  }

  /**
   * transforms world coordinates to screen coordinates for every drawing operation
   * performed in the call back. line width has to be scaled back manually
   * if line thickness needs to be constant in screen space during zoom operations.
   * @param cb
   * @param cnv
   * @protected
   */
  protected drawWorldInScreenSpace(cb: () => void, cnv?: Canvas): void {
    if (!cnv) cnv = this.manager!.getCanvas()
    cnv.context.save()
    cnv.context.scale(cnv.scale, cnv.scale)
    cnv.context.translate(-cnv.offset.x, -cnv.offset.y)
    cb()
    cnv.context.restore()
  }

  // implement this if your overlay provides hotspots that the mouse could interact with
  // hotspot hits will be calculated by the OverlayManager and distributed via the pointer events
  public providesHotspots?(): Hotspot[] {
    return []
  }

  // is needed for ownHotspot caching by the OverlayManager exclusively
  // do not use or override in subclasses!
  public setHotspots(hotspots: Hotspot[]): void {
    this.hotspots = hotspots
  }

  // is needed for ownHotspot caching by the OverlayManager exclusively
  // do not use or override in subclasses!
  public getHotspots(): Hotspot[] {
    return this.hotspots
  }

}
