export interface Overlay {
  onMouseDown(e: MouseEvent): void

  onMouseMove(e: MouseEvent): void

  onMouseUp(e: MouseEvent): void

  onWheel(e: WheelEvent): void

  onRedraw(scale: number): void
}

export interface OverlayContext {
  // container: HTMLDivElement,
  map: HTMLImageElement,
  airbases: HTMLImageElement,
  airbaseMap: HTMLMapElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,

  redraw(scale: number, clean?: boolean): void
}

export class OverlayManager {

  private overlays: Overlay[] = []
  private ovlCtx?: OverlayContext

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
      overlay.onRedraw(scale)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getOverlay = <T extends Overlay>(clazz: new (...args: any[]) => T): T | undefined => {
    return this.overlays.find(overlay => overlay instanceof clazz) as T | undefined
  }

  public activatePointerEvents = (): void => {
    const pane = window
    pane.addEventListener('mousedown', this.mouseDownHandler as EventListener);
    pane.addEventListener('mousemove', this.mouseMoveHandler as EventListener);
    pane.addEventListener('mouseup', this.mouseUpHandler as EventListener);
    pane.addEventListener('wheel', this.wheelHandler as EventListener, {passive: false});
  }

  public deactivatePointerEvents = (): void => {
    const pane = window
    pane.removeEventListener('mousedown', this.mouseDownHandler as EventListener);
    pane.removeEventListener('mousemove', this.mouseMoveHandler as EventListener);
    pane.removeEventListener('mouseup', this.mouseUpHandler as EventListener);
    pane.removeEventListener('wheel', this.wheelHandler as EventListener);
  }

  private peventDefaultFiltered = (e: Event) => {
    const elem = e.target as HTMLElement;
    if (elem.classList.contains("suspend-prevent")) return;
    e.preventDefault()
  }

  private mouseDownHandler = (e: MouseEvent) => {
    this.peventDefaultFiltered(e)
    for (const overlay of this.overlays) {
      overlay.onMouseDown(e)
    }
  }

  private mouseMoveHandler = (e: MouseEvent) => {
    e.preventDefault()
    for (const overlay of this.overlays) {
      overlay.onMouseMove(e)
    }
  }

  private mouseUpHandler = (e: MouseEvent) => {
    e.preventDefault()
    for (const overlay of this.overlays) {
      overlay.onMouseUp(e)
    }
  }

  private wheelHandler = (e: WheelEvent) => {
    e.preventDefault();
    for (const overlay of this.overlays) {
      overlay.onWheel(e)
    }
  }
}
