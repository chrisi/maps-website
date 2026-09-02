import type {Point2D} from "@/model/base.ts";

export interface MilSymbol {
  guid: string
  pos: Point2D
  sym: string
  deleted?: boolean
}

export enum WbShapeType {
  Freehand = 0,
  Line = 1,
  Circle = 2,
  Rect = 3,
  Ellipse = 4,
  Text = 5
}

export interface WbShape {
  type: WbShapeType
  guid: string
  color: string
  lineWidth: number
  dash: number[]
  deleted?: boolean
}

export interface WbPosition  {
  pos: Point2D
}

export interface WbFreehand extends WbShape {
  points: Point2D[]
  cornerIndices: number[]
  path?: Path2D // cache property; will be omitted for websocket transmission
}

export interface WbLine extends WbShape {
  p1: Point2D
  p2: Point2D
}

export interface WbText extends WbShape, WbPosition {
  rotation: number
  text: string
  fontSize: number
}

export interface WbCircle extends WbShape, WbPosition {
  radius: number
  fillColor: string
}

export interface WbEllipse extends WbShape, WbPosition {
  majorRad: number
  minorRad: number
  rotation: number
  fillColor: string
}

export interface WbRect extends WbShape, WbPosition {
  width: number
  height: number
  rotation: number
  fillColor: string
}

export interface Whiteboard {
  symbols: MilSymbol[]
  shapes: WbShape[]
}
