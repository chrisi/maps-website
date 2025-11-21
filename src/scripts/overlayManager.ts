import type {Overlay} from "@/scripts/overlay.ts";

export class OverlayManager {

  private overlays: Overlay[] = []

  public registerOverlay = (overlay: Overlay) => {
    this.overlays.push(overlay)
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
      overlay.mouseDownHandler(e)
    }
  }

  private mouseMoveHandler = (e: MouseEvent) => {
    e.preventDefault()
    for (const overlay of this.overlays) {
      overlay.mouseMoveHandler(e)
    }
  }

  private mouseUpHandler = (e: MouseEvent) => {
    e.preventDefault()
    for (const overlay of this.overlays) {
      overlay.mouseUpHandler(e)
    }
  }

  private wheelHandler = (e: WheelEvent) => {
    e.preventDefault();
    for (const overlay of this.overlays) {
      overlay.wheelHandler(e)
    }
  }
}
