import type {Canvas} from "@/scripts/ov2/Canvas.ts";
import type {OverlayManager} from "@/scripts/ov2/OverlayManager.ts";

export interface Overlay {
  isActive(): boolean

  onDraw(cnv: Canvas): void

  onPointerDown?(e: PointerEvent): void

  onPointerMove?(e: PointerEvent): void

  onPointerUp?(e: PointerEvent): void
}

export abstract class BaseOverlay implements Overlay {

  private readonly manager: OverlayManager

  constructor(manager: OverlayManager) {
    manager.registerOverlay(this)
    this.manager = manager
  }

  public isActive(): boolean {
    return true
  }

  public abstract onDraw(cnv: Canvas): void

  protected redraw(): void {
    this.manager.redraw()
  }
}
