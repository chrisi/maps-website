import {ref} from 'vue'
import {defineStore} from 'pinia'
import {Mode} from "@/model/mode.ts";
import type {Theater} from "@/model/theater.ts";
import type {Coord, Point} from "@/model/base.ts";

export const useStateStore = defineStore('state', () => {
  const mapRef = ref<HTMLImageElement | null>(null);
  const airbasesRef = ref<HTMLImageElement | null>(null);
  const annotationRef = ref<HTMLCanvasElement | null>(null);
  const cnvCtx = ref<CanvasRenderingContext2D | null>(null);

  const mode = ref<Mode>(Mode.None)
  const map = ref<Theater>()!;

  const pos = ref<Point>({x: 0, y: 0})
  const coord = ref<Coord>({lat: 0, long: 0})

  return {mapRef, airbasesRef, annotationRef, cnvCtx, mode, map, pos, coord}
})
