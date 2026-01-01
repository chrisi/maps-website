import type {Overlay} from "@/scripts/ov2/BaseOverlay.ts";
import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {Point} from "@/model/base.ts";

export class OverlayManager {

  private cnv: Canvas | undefined

  private overlays: Overlay[] = []

  private redrawListeners: (() => void)[] = []

  public addRedrawEventListener(listener: () => void): void {
    this.redrawListeners.push(listener)
  }

  public registerOverlay = (overlay: Overlay) => {
    this.overlays.push(overlay)
  }

  public getOverlay = <T extends Overlay>(type: new (...args: any[]) => T): T | undefined => {
    return this.overlays.find(o => o instanceof type) as T | undefined
  }

  public redraw(drawMap: boolean = true): void {
    if (drawMap) {
      this.redrawListeners.forEach(listener => listener())
    } else {
      if (!this.cnv) return
      this.draw(this.cnv.context, this.cnv.offset, this.cnv.scale)
    }
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

  private errorMessage = (overlay: Overlay, e?: Event): string => `error in overlay '${overlay.constructor.name}'${e ? ` on '${e.type}' event` : ''}`
}
