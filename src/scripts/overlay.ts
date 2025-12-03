import {useGlobalStore} from "@/stores/global.ts";
import type {Point} from "@/model/base.ts";
import {distance} from "@/scripts/math.ts";

const DEBUG = true;
const MOVE_DEBUG = false;

export interface Overlay {
  onTouchStart?(e: TouchEvent): void

  onTouchMove?(e: TouchEvent): void

  onTouchEnd?(e: TouchEvent): void

  onTouchCancel?(e: TouchEvent): void

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
  threshold: number, // the distance to the pointer at which the target is considered hit
  name: string, // generic name of the target, no matter the type for hovering hint
  type: string, // type of the target, e.g., Mil-Symbol, Airbase, can be used for priority management
  target?: object, // the target object, e.g., airbase or mil-symbol
}

interface PointerTargetCandidate {
  dist: number, // distance to the pointer at hit detection
  target: PointerTarget
}

export class OverlayManager {

  private overlays: Overlay[] = []
  private ovlCtx?: OverlayContext
  private global = useGlobalStore()

  private isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  private canPinch = navigator.maxTouchPoints > 1
  private useMouseHandlers = true
  private useTouchHandlers = this.isMobile || this.canPinch
  private eventSource: HTMLCanvasElement | Window = window

  public init = (overlayContext: OverlayContext) => {
    overlayContext.redraw = this.redraw
    this.ovlCtx = overlayContext
    this.eventSource = this.ovlCtx!.canvas
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
    console.log(navigator.userAgent)
    console.log("activatePointerEvents. mobile: " + this.isMobile + ", canPinch: " + this.canPinch + ", touch: " + (this.isMobile ? "touch" : "mouse"))
    const src = this.eventSource
    //const pane = window
    if (this.useTouchHandlers) {
      console.log("activate touch handlers")
      src.addEventListener('touchstart', this.touchStartHandler as EventListener);
      src.addEventListener('touchmove', this.touchMoveHandler as EventListener);
      src.addEventListener('touchend', this.touchEndHandler as EventListener);
    }
    if (this.useMouseHandlers) {
      console.log("activating mouse handlers")
      src.addEventListener('click', this.clickHandler as EventListener);
      src.addEventListener('dblclick', this.dblClickHandler as EventListener);
      src.addEventListener('contextmenu', this.contextMenuHandler as EventListener);
      src.addEventListener('mousedown', this.mouseDownHandler as EventListener);
      // using window here -> continue to pan maps when cursor is outside the window temporarilly
      window.addEventListener('mousemove', this.mouseMoveHandler as EventListener);
      src.addEventListener('mouseup', this.mouseUpHandler as EventListener);
      src.addEventListener('wheel', this.wheelHandler as EventListener, {passive: false});
    }
  }

  public deactivatePointerEvents = (): void => {
    const src = this.eventSource
    if (this.useTouchHandlers) {
      src.removeEventListener('touchstart', this.touchStartHandler as EventListener);
      src.removeEventListener('touchmove', this.touchMoveHandler as EventListener);
      src.removeEventListener('touchend', this.touchEndHandler as EventListener);
    }
    if (this.useMouseHandlers) {
      src.removeEventListener('click', this.clickHandler as EventListener);
      src.removeEventListener('dblclick', this.dblClickHandler as EventListener);
      src.removeEventListener('contextmenu', this.contextMenuHandler as EventListener);
      src.removeEventListener('mousedown', this.mouseDownHandler as EventListener);
      window.removeEventListener('mousemove', this.mouseMoveHandler as EventListener);
      src.removeEventListener('mouseup', this.mouseUpHandler as EventListener);
      src.removeEventListener('wheel', this.wheelHandler as EventListener);
    }
  }

  private preventDefaultFiltered = (e: Event) => {
    const elem = e.target as HTMLElement;
    if (elem.classList.contains("suspend-prevent")) return;
    e.preventDefault()
  }

  private findPointerTargets(pt: Point, singel: boolean = false): PointerTarget[] {
    const res: PointerTargetCandidate[] = []
    //TODO: priority management: sort overlays by priority (tbd)
    //TODO: manage exactly colocated items by trigger threshold (tbd)
    for (const overlay of this.overlays) {
      if (overlay.isActive() && overlay.providesPointerTargets) {
        for (const tgt of overlay.providesPointerTargets()) {
          const dist = distance(pt, tgt.pos)
          if (dist < tgt.threshold) {
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
    if (DEBUG) console.log("click")
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive())
          overlay.onClick(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private touchStartHandler = (e: TouchEvent) => {
    this.preventDefaultFiltered(e)
    if (DEBUG) console.log("touchStart")
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive())
          if (overlay.onTouchStart)
            overlay.onTouchStart(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private touchMoveHandler = (e: TouchEvent) => {
    e.preventDefault()
    if (MOVE_DEBUG) console.log("touchMove")
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive())
          if (overlay.onTouchMove)
            overlay.onTouchMove(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private touchEndHandler = (e: TouchEvent) => {
    e.preventDefault()
    if (DEBUG) console.log("touchEnd")
    for (const overlay of this.overlays) {
      try {
        if (overlay.isActive())
          if (overlay.onTouchEnd)
            overlay.onTouchEnd(e)
      } catch (err) {
        console.error(this.errorMessage(overlay, e), err);
      }
    }
  }

  private dblClickHandler = (e: MouseEvent) => {
    this.preventDefaultFiltered(e)
    if (DEBUG) console.log("dblClick")
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
    if (DEBUG) console.log("contextMenu")
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
    this.preventDefaultFiltered(e) //TODO: check usage e.preventDefault()
    if (DEBUG) console.log("mouseDown: " + e.buttons)
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
    if (MOVE_DEBUG) console.log("mouseMove: " + e.buttons)
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
    if (DEBUG) console.log("mouseUp: " + e.buttons)
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
    if (DEBUG) console.log("wheel")
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
