import type {Point} from "@/model/base.ts";

export interface LineSegment {
  points: Point[]
  cornerIndices: number[]
  color: string
  width: number
  dash: number[]
}
