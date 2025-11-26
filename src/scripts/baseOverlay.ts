import type {DrawingContext, Overlay} from "@/scripts/overlay.ts";

export class BaseOverlay implements Overlay {
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

}
