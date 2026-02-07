import {useGlobalStore} from "@/stores/global.ts";
import {distance} from "@/scripts/math.ts";
import type {Overlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point} from "@/model/base.ts";
import type {Hotspot} from "@/scripts/overlays/Hotspot.ts";
import type {ImcsClient} from "@/scripts/ImcsClient.ts";

interface HotspotCandidate {
  dist: number, // distance to the pointer at hit detection
  target: Hotspot
}

export class OverlayManager {

  private global = useGlobalStore()

  private cnv: Canvas | undefined

  private overlays: Overlay[] = []

  private redrawListeners: (() => void)[] = []

  private clickPos: Point | undefined = undefined

  private allHotspots: Hotspot[] = []

  private readonly imcsClient: ImcsClient

  constructor(imcsClient: ImcsClient) {
    this.imcsClient = imcsClient
  }

  public addRedrawEventListener(listener: () => void): void {
    this.redrawListeners.push(listener)
  }

  public registerOverlay = <T extends Overlay>(overlay: T): T => {
    this.overlays.push(overlay)
    overlay.setOverlayManager(this)
    overlay.setImcsClient(this.imcsClient)
    overlay.init?.()
    return overlay
  }

  public getOverlay = <T extends Overlay>(type: new (...args: any[]) => T): T | undefined => {
    return this.overlays.find(o => o instanceof type) as T | undefined
  }

  public getCanvas(): Canvas {
    if (!this.cnv) throw new Error("Canvas not initialized")
    return this.cnv
  }

  public draw = (context: CanvasRenderingContext2D, offset: Point, scale: number): void => {
    for (const overlay of this.overlays) {
      try {
        if (overlay.isEnabled()) {
          this.cnv = {
            context: context,
            offset: offset,
            scale: scale
          }
          // const start = performance.now() // Start timing
          overlay.onDraw(this.cnv)
          // const end = performance.now() // End timing
          // console.trace(`Redraw of ${overlay.constructor.name} took ${(end - start).toFixed(2)} ms`)
        }
      } catch (err) {
        console.error(this.errorMessage(overlay) + ` on redraw with scale ${scale}.`, err);
      }
    }
  }

  public redraw(drawMap: boolean = true): void {
    if (drawMap) {
      this.redrawListeners.forEach(listener => listener())
    } else {
      if (!this.cnv) throw new Error("Canvas not initialized")
      this.draw(this.cnv.context, this.cnv.offset, this.cnv.scale)
    }
  }

  private findHotspots(pointerPos: Point, hotspotIterator: (cb: (hotspot: Hotspot) => void) => void, single: boolean = false): Hotspot[] {
    if (!this.cnv) return []
    const pt = {
      x: pointerPos.x / this.cnv.scale + this.cnv.offset.x,
      y: pointerPos.y / this.cnv.scale + this.cnv.offset.y
    }
    const res: HotspotCandidate[] = []
    const saveScale = this.cnv.scale ?? 1
    //TODO: priority management: sort overlays by priority (tbd)
    //TODO: manage exactly colocated items by trigger threshold (tbd)
    hotspotIterator(hs => {
      let dist = this.isNearbyHotspot(hs, pt, saveScale)
      if (dist) {
        if (single) return [hs]
        res.push({target: hs, dist: dist})
      }
    })
    return res.sort((a, b) => a.dist - b.dist).map(c => c.target)
  }

  private isNearbyHotspot(hs: Hotspot, pt: Point, saveScale: number): number | undefined {
    const dist = distance(pt, hs.pos)
    const sz = !hs.size ? 15 / saveScale : (hs.size < 0 ? -hs.size / saveScale : hs.size) // TODO 15: make global hot spot size configurable
    if (dist < sz) return dist
  }

  public forEachHotspot(cb: (hotspot: Hotspot) => void) {
    for (const overlay of this.overlays) {
      if (overlay.isEnabled()) {
        for (const hs of overlay.providesHotspots?.() ?? []) {
          cb(hs)
        }
      }
    }
  }

  public onPointerDown(e: PointerEvent): void {
    this.clickPos = {x: e.pageX, y: e.pageY}
    this.calculateAllHotspots({x: e.pageX, y: e.pageY})
    for (const overlay of this.overlays) {
      if (overlay.isEnabled() && (overlay.getActiveMode() == this.global.mode || !overlay.getActiveMode())) {
        const ownHs = this.calculateOwnHotspots(overlay, {x: e.pageX, y: e.pageY})
        overlay.onPointerDown?.(e, ownHs)
      }
    }
  }

  public onPointerMove(e: PointerEvent): void {
    this.calculateAllHotspots({x: e.pageX, y: e.pageY})
    for (const overlay of this.overlays) {
      if (overlay.isEnabled() && (overlay.getActiveMode() == this.global.mode || !overlay.getActiveMode())) {
        overlay.onPointerMove?.(e, this.allHotspots)
        if (this.allHotspots.length > 0)
          overlay.onHoverHotspot?.(this.allHotspots, e)
        const ownHs = this.calculateOwnHotspots(overlay, {x: e.pageX, y: e.pageY})
        if (ownHs.length > 0)
          overlay.onHoverOwnHotspot?.(ownHs, e)
      }
    }
  }

  public onPointerUp(e: PointerEvent): void {
    const isClick = e.pageX === this.clickPos?.x && e.pageY === this.clickPos?.y
    this.clickPos = undefined
    for (const overlay of this.overlays) {
      if (overlay.isEnabled() && (overlay.getActiveMode() == this.global.mode || !overlay.getActiveMode())) {
        overlay.onPointerUp?.(e, overlay.getHotspots(), isClick)
        if (isClick) {
          if (this.allHotspots.length > 0)
            overlay.onClickHotspot?.(this.allHotspots, e)
          if (overlay.getHotspots().length > 0)
            overlay.onClickOwnHotspot?.(overlay.getHotspots(), e)
          // emit a standard click event with optional consumable hotspots, if any
          overlay.onClick?.(e, overlay.getHotspots())
        }
      }
    }
  }

  public onLongPress(e: PointerEvent): void {
    this.calculateAllHotspots({x: e.pageX, y: e.pageY})
    for (const overlay of this.overlays) {
      if (overlay.isEnabled() && (overlay.getActiveMode() == this.global.mode || !overlay.getActiveMode())) {
        const ownHs = this.calculateOwnHotspots(overlay, {x: e.pageX, y: e.pageY})
        overlay.onLongPress?.(e, ownHs)
      }
    }
  }

  private calculateAllHotspots(pt: Point): void {
    this.allHotspots = this.findHotspots(pt, cb => this.forEachHotspot(cb), false)
    this.global.hotspots = this.allHotspots
  }

  private calculateOwnHotspots(overlay: Overlay, pt: Point): Hotspot[] {
    let ownCandidates = overlay.providesHotspots?.() || []
    const ownHs = this.findHotspots(pt, cb => ownCandidates.forEach(cb), false)
    overlay.setHotspots(ownHs)
    return ownHs
  }

  private errorMessage = (overlay: Overlay, e?: Event): string => `error in overlay '${overlay.constructor.name}'${e ? ` on '${e.type}' event` : ''}`
}
