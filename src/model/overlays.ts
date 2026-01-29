import type {Point} from "@/model/base.ts";

export interface MilSymbol {
  guid: string
  pos: Point
  sym: string
}

export type WbShapeType = 'freehand' | 'line' | 'circle' | 'rect' | 'ellipse'

export interface WbShape {
  type: WbShapeType
  guid: string
  color: string
  width: number
  dash: number[]
  deleted?: boolean
}

export interface WbFreehand extends WbShape {
  points: Point[]
  cornerIndices: number[]
  path?: Path2D // cache property; will be omitted for websocket transmission
}

export interface WbLine extends WbShape {
  p1: Point
  p2: Point
}

export interface WbCircle extends WbShape {
  center: Point
  radius: number
  fillColor: string
}

export interface WbEllipse extends WbShape {
  center: Point
  majorRad: number
  minorRad: number
  rotation: number
  fillColor: string
}

export interface WbRect extends WbShape {
  p1: Point
  p2: Point
  rotation: number
  fillColor: string
}
