import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useContextStore = defineStore('context', () => {
  const mapRef = ref<HTMLImageElement | null>(null);
  const airbasesRef = ref<HTMLImageElement | null>(null);
  const annotationRef = ref<HTMLCanvasElement | null>(null);
  const cnvCtx = ref<CanvasRenderingContext2D | null>(null);
  return {mapRef, airbasesRef, annotationRef, cnvCtx}
})
