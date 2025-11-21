export interface Overlay {
  mouseDownHandler(e: MouseEvent): void

  mouseMoveHandler(e: MouseEvent): void

  mouseUpHandler(e: MouseEvent): void

  wheelHandler(e: WheelEvent): void
}
