import type {DrawingContext, Overlay, OverlayContext} from "@/scripts/overlay.ts";
import {useGlobalStore} from "@/stores/global.ts";
import {useSettingsStore} from "@/stores/settings.ts";

export class BaseOverlay implements Overlay {

  protected ovlCtx: OverlayContext

  protected global = useGlobalStore()
  protected settings = useSettingsStore()

  protected rescale = 1.0

  constructor(ovlCtx: OverlayContext) {
    console.log(`initializing '${this.constructor.name}' overlay`)
    this.ovlCtx = ovlCtx
    // scale station coords to canvas size
    this.rescale = 1.0 / this.global.map!.stationMappingSize * this.global.map!.pixels
  }

  //TODO: check optional interface implementations (e.g., onClick?())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onClick(e: MouseEvent): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onDblClick(e: MouseEvent): void {
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onContextMenu(e: MouseEvent): void {
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
   * Returns true if the left mouse button is pressed.
   * to be used in mouse-move handlers.
   */
  protected isLeftMouseDown(): boolean {
    return (this.ovlCtx.mouseDown & 1) > 0
  }

  /**
   * Returns true if the right mouse button is pressed.
   * to be used in mouse-move handlers.
   */
  protected isRightMouseDown(): boolean {
    return (this.ovlCtx.mouseDown & 2) > 0
  }

  /**
   * Returns true if the middle mouse button is pressed.
   * to be used in mouse-move handlers.
   */
  protected isAuxMouseDown(): boolean {
    return (this.ovlCtx.mouseDown & 4) > 0
  }

  /**
   * Returns true if the left mouse button is pressed.
   * to be used in mouse-up/down handlers.
   */
  protected isLeftMouse(e: MouseEvent): boolean {
    return e.button == 0
  }

  /**
   * Returns true if the middle mouse button is pressed.
   * to be used in mouse-up/down handlers.
   */
  protected isAuxMouse(e: MouseEvent): boolean {
    return e.button == 1
  }

  /**
   * Returns true if the right mouse button is pressed.
   * to be used in mouse-up/down handlers.
   */
  protected isRightMouse(e: MouseEvent): boolean {
    return e.button == 2
  }

  /**
   * Redraws all overlays after first clearing the canvas.
   */
  protected redraw(): void {
    this.ovlCtx.redraw(1, true)
  }

}
