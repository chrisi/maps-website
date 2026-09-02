import type {Point2D} from "@/model/base.ts";

export interface Canvas {
    context: CanvasRenderingContext2D,
    offset: Point2D,
    scale: number
}
