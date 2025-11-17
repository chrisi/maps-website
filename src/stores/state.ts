import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useStateStore = defineStore('state', () => {
  const mapRef = ref<HTMLImageElement | null>(null);
  const airbasesRef = ref<HTMLImageElement | null>(null);
  const annotationRef = ref<HTMLCanvasElement | null>(null);

  return {mapRef, airbasesRef, annotationRef}
})
