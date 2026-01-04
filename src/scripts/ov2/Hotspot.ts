import type {Point} from "@/model/base.ts";

export interface Hotspot {
  pos: Point, // position of the target, in pixels
  size?: number, // size of the hotspot, undefined: global size will be used, negative value: zoom independent size
  name: string, // generic name of the target, no matter the type for hovering hint
  provider: string, // the overlay that provides the hotspot
  type: string, // type of the target, e.g., Mil-Symbol, Airbase, can be used for priority management
  target?: object, // the target object, e.g., airbase or mil-symbol
}
