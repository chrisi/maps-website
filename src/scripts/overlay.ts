import {useGlobalStore} from "@/stores/global.ts";
import type {Point} from "@/model/base.ts";
import {distance} from "@/scripts/math.ts";

export interface Overlay {
  onClick(e: MouseEvent): void

  onDblClick(e: MouseEvent): void

  onContextMenu(e: MouseEvent): void

  onMouseDown(e: MouseEvent): void

  onMouseMove(e: MouseEvent): void

  onMouseUp(e: MouseEvent): void

  onWheel(e: WheelEvent): void

  onRedraw(dc: DrawingContext): void

  onHoverPointerTarget?(targets: PointerTarget[]): void

  providesPointerTargets?(): PointerTarget[]

  isActive(): boolean
}

export interface DrawingContext {
  cnvCtx: CanvasRenderingContext2D,
  absScale: number,
  deltaScale: number
}

export interface OverlayContext {
  map: HTMLImageElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,

  redraw(scale: number, clean?: boolean): void

  mouseDown: number
}

export interface PointerTarget {
  pos: Point, // position of the target, in pixels
  name: string, // generic name of the target, no matter the type for hovering hint
  target?: object, // the target object, e.g., airbase or mil-symbol
}

interface PointerTargetCandidate {
  dist: number, // distance to the pointer at hit detection
  target: PointerTarget
}

export class OverlayManager {

  private threshold = 15; //TODO: make dist configurable

  private overlays: Overlay[] = []
  private ovlCtx?: OverlayContext
  private global = useGlobalStore()

  public init = (overlayContext: OverlayContext) => {
    overlayContext.redraw = this.redraw
    this.ovlCtx = overlayContext
  }

  public registerOverlay = (overlay: Overlay) => {
    this.overlays.push(overlay)
  }

  public redraw = (scale: number, clean: boolean = false): void => {
    if (clean) {
      this.ovlCtx!.context.clearRect(0, 0, this.ovlCtx!.canvas.width, this.ovlCtx!.canvas.height);
    }
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive()) {
          const dc: DrawingContext = {cnvCtx: this.ovlCtx!.context, absScale: this.global.zoom.factor, deltaScale: scale}
          // const start = performance.now() // Start timing
          overlay.onRedraw(dc)
          // const end = performance.now() // End timing
          // console.trace(`Redraw of ${overlay.constructor.name} took ${(end - start).toFixed(2)} ms`)
        }
      } catch (err) {
        console.error(this.errorMessage(overlay) + ` on redraw with scale ${scale}.`, err);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getOverlay = <T extends Overlay>(clazz: new (...args: any[]) => T): T | undefined => {
    return this.overlays.find(overlay => overlay instanceof clazz) as T | undefined
  }

  public activatePointerEvents = (): void => {
    const pane = window
    pane.addEventListener('click', this.clickHandler as EventListener);
    pane.addEventListener('dblclick', this.dblClickHandler as EventListener);
    pane.addEventListener('contextmenu', this.contextMenuHandler as EventListener);
    pane.addEventListener('mousedown', this.mouseDownHandler as EventListener);
    pane.addEventListener('mousemove', this.mouseMoveHandler as EventListener);
    pane.addEventListener('mouseup', this.mouseUpHandler as EventListener);
    pane.addEventListener('wheel', this.wheelHandler as EventListener, {passive: false});
  }

  public deactivatePointerEvents = (): void => {
    const pane = window
    pane.removeEventListener('click', this.clickHandler as EventListener);
    pane.removeEventListener('dblclick', this.dblClickHandler as EventListener);
    pane.removeEventListener('contextmenu', this.contextMenuHandler as EventListener);
    pane.removeEventListener('mousedown', this.mouseDownHandler as EventListener);
    pane.removeEventListener('mousemove', this.mouseMoveHandler as EventListener);
    pane.removeEventListener('mouseup', this.mouseUpHandler as EventListener);
    pane.removeEventListener('wheel', this.wheelHandler as EventListener);
  }

  private preventDefaultFiltered = (e: Event) => {
    const elem = e.target as HTMLElement;
    if (elem.classList.contains("suspend-prevent")) return;
    e.preventDefault()
  }

  private findPointerTargets(pt: Point, singel: boolean = false): PointerTarget[] {
    const res: PointerTargetCandidate[] = []
    //TODO: priority management: sort overlays by priority (tbd)
    for (const overlay of this.overlays) {
      if (overlay.isActive() && overlay.providesPointerTargets) {
        for (const tgt of overlay.providesPointerTargets()) {
          const dist = distance(pt, tgt.pos)
          if (dist < this.threshold) {
            if (singel) return [tgt]
            res.push({target: tgt, dist: dist})
          }
        }
      }
    }
    return res.sort((a, b) => a.dist - b.dist).map(c => c.target)
  }

  private clickHandler = (e: MouseEvent) => {
    this.preventDefaultFiltered(e)
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive())
          overlay.onClick(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private dblClickHandler = (e: MouseEvent) => {
    this.preventDefaultFiltered(e)
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive())
          overlay.onDblClick(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private contextMenuHandler = (e: MouseEvent) => {
    this.preventDefaultFiltered(e)
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive())
          overlay.onContextMenu(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private mouseDownHandler = (e: MouseEvent) => {
    this.preventDefaultFiltered(e)
    for (const overlay of this.overlays) {
      this.ovlCtx!.mouseDown = e.buttons
      try {
        if (overlay.isActive())
          overlay.onMouseDown(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private mouseMoveHandler = (e: MouseEvent) => {
    e.preventDefault()
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive()) {
          overlay.onMouseMove(e)
          const tgts = this.findPointerTargets({x: e.pageX, y: e.pageY}, e.altKey);
          this.global.pointerTargets = tgts
          if (tgts.length > 0) overlay.onHoverPointerTarget?.(tgts)
        }
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private mouseUpHandler = (e: MouseEvent) => {
    e.preventDefault()
    for (const overlay of this.overlays) {
      this.ovlCtx!.mouseDown = e.buttons
      try {
        if (overlay.isActive())
          overlay.onMouseUp(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private wheelHandler = (e: WheelEvent) => {
    e.preventDefault();
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive())
          overlay.onWheel(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private errorMessage = (overlay: Overlay, e?: Event): string => `error in overlay '${overlay.constructor.name}'${e ? ` on '${e.type}' event` : ''}`
}
