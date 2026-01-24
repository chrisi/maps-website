import type {Point} from "@/model/base.ts";

export interface MilSymbol {
  guid: string
  pos: Point
  sym: string
}

export type WbDrawType = 'freehand' | 'line' | 'circle' | 'rect'

export interface WbDraw {
  type: WbDrawType
  guid: string
  color: string
  width: number
  dash: number[]
}

export interface WbFreehand extends WbDraw {
  points: Point[]
  cornerIndices: number[]
}

export interface WbLine extends WbDraw {
  p1: Point
  p2: Point
}

export interface WbCircle extends WbDraw {
  center: Point
  radius: number
  fillColor: string
}

export interface WbRect extends WbDraw {
  p1: Point
  p2: Point
  rotation: number
  fillColor: string
}
