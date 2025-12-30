import type {Point} from "@/model/base.ts";

export interface Canvas {
    context: CanvasRenderingContext2D,
    offset: Point,
    scale: number
}
