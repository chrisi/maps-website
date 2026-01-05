import type {Overlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {Point} from "@/model/base.ts";
import {distance} from "@/scripts/math.ts";
import type {Hotspot} from "@/scripts/ov2/Hotspot.ts";
import {useGlobalStore} from "@/stores/global.ts";

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

  public addRedrawEventListener(listener: () => void): void {
    this.redrawListeners.push(listener)
  }

  public registerOverlay = (overlay: Overlay) => {
    this.overlays.push(overlay)
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
        if (overlay.isActive()) {
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

  private findHotspots(pointerPos: Point, single: boolean = false): Hotspot[] {
    if (!this.cnv) return []
    const pt = {
      x: pointerPos.x / this.cnv.scale + this.cnv.offset.x,
      y: pointerPos.y / this.cnv.scale + this.cnv.offset.y
    }
    const res: HotspotCandidate[] = []
    const saveScale = this.cnv?.scale ?? 1
    //TODO: priority management: sort overlays by priority (tbd)
    //TODO: manage exactly colocated items by trigger threshold (tbd)
    this.forEachHotspot(hs => {
      const dist = distance(pt, hs.pos)
      const sz = !hs.size ? 15 / saveScale : (hs.size < 0 ? -hs.size / saveScale : hs.size) // TODO 15: make global hot spotsize configurable
      if (dist < sz) {
        if (single) return [hs]
        res.push({target: hs, dist: dist})
      }
    })
    return res.sort((a, b) => a.dist - b.dist).map(c => c.target)
  }

  public forEachHotspot(cb: (hotspot: Hotspot) => void) {
    for (const overlay of this.overlays) {
      if (overlay.isActive()) {
        for (const hs of overlay.providesHotspots?.() ?? []) {
          cb(hs)
        }
      }
    }
  }

  public onPointerDown(e: PointerEvent): void {
    this.clickPos = {x: e.pageX, y: e.pageY}
    for (const overlay of this.overlays) {
      if (overlay.isActive()) {
        overlay.onPointerDown?.(e)
      }
    }
  }

  public onPointerMove(e: PointerEvent): void {
    const hs = this.findHotspots({x: e.pageX, y: e.pageY}, false)
    this.global.hotspots = hs
    for (const overlay of this.overlays) {
      if (overlay.isActive()) {
        overlay.onPointerMove?.(e)
        if (hs.length > 0) overlay.onHoverHotspot?.(hs)
      }
    }
  }

  public onPointerUp(e: PointerEvent): void {
    const isClick = e.pageX === this.clickPos?.x && e.pageY === this.clickPos?.y
    this.clickPos = undefined
    const hs = this.findHotspots({x: e.pageX, y: e.pageY}, false)
    this.global.hotspots = hs
    for (const overlay of this.overlays) {
      if (overlay.isActive()) {
        overlay.onPointerUp?.(e)
        if (isClick && hs.length > 0) overlay.onClickHotspot?.(hs)
      }
    }
  }

  private errorMessage = (overlay: Overlay, e?: Event): string => `error in overlay '${overlay.constructor.name}'${e ? ` on '${e.type}' event` : ''}`
}
