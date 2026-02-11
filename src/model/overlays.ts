import type {Point} from "@/model/base.ts";

export interface MilSymbol {
  guid: string
  pos: Point
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

export interface WbFreehand extends WbShape {
  points: Point[]
  cornerIndices: number[]
  path?: Path2D // cache property; will be omitted for websocket transmission
}

export interface WbLine extends WbShape {
  p1: Point
  p2: Point
}

export interface WbText extends WbShape {
  pos: Point
  rotation: number
  text: string
  fontSize: number
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
  center: Point
  width: number
  height: number
  rotation: number
  fillColor: string
}
