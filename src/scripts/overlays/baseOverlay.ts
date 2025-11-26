import type {DrawingContext, Overlay, OverlayContext} from "@/scripts/overlay.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";

export class BaseOverlay implements Overlay {

  protected ovlCtx: OverlayContext

  protected global = useGlobalStore()
  protected settings = useSettingsStore()

  constructor(ovlCtx: OverlayContext) {
    console.log(`initializing '${this.constructor.name}' overlay`)
    this.ovlCtx = ovlCtx
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMouseDown(e: MouseEvent): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMouseMove(e: MouseEvent): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMouseUp(e: MouseEvent): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onWheel(e: WheelEvent): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onRedraw(dc: DrawingContext): void {
  }

  public isActive(): boolean {
    return true
  }

  /**
   * Redraws all overlays after first clearing the canvas.
   */
  protected redraw(): void {
    this.ovlCtx.redraw(1, true)
  }

}
