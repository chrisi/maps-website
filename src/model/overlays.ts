import type {Point} from "@/model/base.ts";

export interface MilSymbol {
  guid: string
  pos: Point
  sym: string
}

export interface LineSegment {
  guid: string
  points: Point[]
  cornerIndices: number[]
  color: string
  width: number
  dash: number[]
}
