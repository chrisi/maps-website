<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import type {Point} from "@/model/base.ts";

const props = withDefaults(defineProps<{
  src: string
  suspend: boolean
  cursor?: string
}>(), {
  cursor: 'default'
})

const emit = defineEmits<{
  (e: 'update:zoom', zoom: number): void
  (e: 'update:pos', pos: Point): void
  (e: 'init', ctx: CanvasRenderingContext2D): void
  (e: 'draw', ctx: CanvasRenderingContext2D, offset: { x: number, y: number }, scale: number): void
  (e: 'pointerdown', event: PointerEvent): void
  (e: 'pointerup', event: PointerEvent): void
  (e: 'pointermove', event: PointerEvent): void
}>()

defineExpose({
  locatePosition,
  redrawOverlay
})

const mapRef = ref<HTMLCanvasElement | null>(null)
const overlayRef = ref<HTMLCanvasElement | null>(null)

const isLoading = ref(true)
const mapLoaded = ref(false)
const loadProgress = ref(0)

let ctx: CanvasRenderingContext2D | null = null;
let ovlCtx: CanvasRenderingContext2D | null = null;

const mapImage = new Image();

async function loadMapImage(src: string) {
  isLoading.value = true;
  mapLoaded.value = false;
  loadProgress.value = 0;

  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    let loaded = 0;
    const reader = response.body?.getReader();
    if (!reader) {
      mapImage.src = src;
      return;
    }

    const chunks = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (total > 0) {
        loadProgress.value = Math.round((loaded / total) * 100);
      }
    }

    const blob = new Blob(chunks);
    mapImage.src = URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to load map image:", error);
    // Fallback to simple image loading if fetch fails
    mapImage.src = src;
  }
}

watch(() => props.src, (newSrc) => {
  loadMapImage(newSrc);
})

watch(() => props.suspend, (isSuspended) => {
  if (isSuspended) {
    // Logic when map interactions should stop
    isPanning = false;
    pointers.clear();
    vx = 0;
    vy = 0;
  } else {
    // Logic when map interactions should resume
  }
})

const maxScale = 4;

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let vx = 0;
let vy = 0;
let lastX = 0;
let lastY = 0;
let lastTime = 0;
let isPanning = false;

let targetScale = 1;
let targetOffsetX: number | null = null;
let targetOffsetY: number | null = null;
let zoomFocalX = 0;
let zoomFocalY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let isAnimating = false;

onMounted(() => {
  if (!mapRef.value || !overlayRef.value)
    return
  ctx = mapRef.value.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }
  ovlCtx = overlayRef.value.getContext("2d");
  if (ovlCtx) {
    ovlCtx.imageSmoothingEnabled = true;
    ovlCtx.imageSmoothingQuality = "high";
    emit('init', ovlCtx);
  }
  window.addEventListener("resize", resize);
  resize();

  mapImage.onload = () => {
    isLoading.value = false;
    mapLoaded.value = true;

    if (mapImage.src.startsWith('blob:')) {
      URL.revokeObjectURL(mapImage.src);
    }

    // Center image initially
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    scale = Math.min(vw / mapImage.width, vh / mapImage.height);
    targetScale = scale;
    constrain();
    redraw();
    emit('update:zoom', scale);
  };

  if (props.src) {
    loadMapImage(props.src);
  }

  mapRef.value.style.touchAction = 'none'
  mapRef.value.addEventListener("pointerdown", onDown);
  mapRef.value.addEventListener("pointermove", onMove);
  mapRef.value.addEventListener("pointerup", onUp);
  mapRef.value.addEventListener("pointercancel", onUp);
  mapRef.value.addEventListener("wheel", onWheel, {passive: false});
})

function resize() {
  if (mapRef.value) {
    const dpr = window.devicePixelRatio || 1;
    mapRef.value.width = window.innerWidth * dpr;
    mapRef.value.height = window.innerHeight * dpr;
    mapRef.value.style.width = window.innerWidth + 'px';
    mapRef.value.style.height = window.innerHeight + 'px';

    ctx = mapRef.value.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
  }
  if (overlayRef.value) {
    const dpr = window.devicePixelRatio || 1;
    overlayRef.value.width = window.innerWidth * dpr;
    overlayRef.value.height = window.innerHeight * dpr;
    overlayRef.value.style.width = window.innerWidth + 'px';
    overlayRef.value.style.height = window.innerHeight + 'px';

    const oCtx = overlayRef.value.getContext("2d");
    if (oCtx) {
      oCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  constrain();
  redraw();
}

function constrain() {
  if (!mapRef.value || !mapImage.width) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mw = mapImage.width * scale;
  const mh = mapImage.height * scale;

  // 1. Constrain Scale (Min scale: fill viewport)
  const minScale = Math.max(vw / mapImage.width, vh / mapImage.height);

  if (scale < minScale) {
    scale = minScale;
  }
  if (scale > maxScale) {
    scale = maxScale;
  }
  if (targetScale < minScale) {
    targetScale = minScale;
  }
  if (targetScale > maxScale) {
    targetScale = maxScale;
  }

  // Recalculate dimensions with constrained scale
  const mw_c = mapImage.width * scale;
  const mh_c = mapImage.height * scale;

  // 2. Constrain Offset
  // Horizontal
  if (mw_c <= vw) {
    offsetX = (vw - mw_c) / 2;
  } else {
    if (offsetX > 0) offsetX = 0;
    if (offsetX + mw_c < vw) offsetX = vw - mw_c;
  }

  // Vertical
  if (mh_c <= vh) {
    offsetY = (vh - mh_c) / 2;
  } else {
    if (offsetY > 0) offsetY = 0;
    if (offsetY + mh_c < vh) offsetY = vh - mh_c;
  }
}

function redraw() {
  if (!ctx) return;
  ctx.drawImage(mapImage, offsetX, offsetY, mapImage.width * scale, mapImage.height * scale);
  redrawOverlay();
}

function redrawOverlay() {
  if (!ovlCtx) return;
  ovlCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  emit('draw', ovlCtx, {x: -offsetX / scale, y: -offsetY / scale}, scale);
}

function zoomAt(x: number, y: number, zoomFactor: number) {
  offsetX = x - (x - offsetX) * zoomFactor;
  offsetY = y - (y - offsetY) * zoomFactor;
  scale *= zoomFactor;
  constrain();
  redraw();
}

function smoothZoomAt(x: number, y: number, zoomFactor: number) {
  targetScale *= zoomFactor;
  if (targetScale > maxScale) targetScale = maxScale;
  zoomFocalX = x;
  zoomFocalY = y;
  targetOffsetX = null;
  targetOffsetY = null;

  if (!isAnimating) {
    isAnimating = true;
    requestAnimationFrame(animate);
  }
}

function locatePosition(pos: Point, newScale?: number) {
  if (newScale !== undefined) {
    targetScale = newScale;
  }
  if (targetScale > maxScale) targetScale = maxScale;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  targetOffsetX = vw / 2 - pos.x * targetScale;
  targetOffsetY = vh / 2 - pos.y * targetScale;

  // Constrain target offsets
  const minScale = Math.max(vw / mapImage.width, vh / mapImage.height);
  let effectiveTargetScale = targetScale;
  if (effectiveTargetScale < minScale) effectiveTargetScale = minScale;
  if (effectiveTargetScale > maxScale) effectiveTargetScale = maxScale;

  const mw = mapImage.width * effectiveTargetScale;
  const mh = mapImage.height * effectiveTargetScale;

  if (mw <= vw) {
    targetOffsetX = (vw - mw) / 2;
  } else {
    if (targetOffsetX > 0) targetOffsetX = 0;
    if (targetOffsetX + mw < vw) targetOffsetX = vw - mw;
  }

  if (mh <= vh) {
    targetOffsetY = (vh - mh) / 2;
  } else {
    if (targetOffsetY > 0) targetOffsetY = 0;
    if (targetOffsetY + mh < vh) targetOffsetY = vh - mh;
  }

  if (!isAnimating) {
    isAnimating = true;
    requestAnimationFrame(animate);
  }
}

function toImageCoords(x: number, y: number) {
  return {
    x: (x - offsetX) / scale,
    y: (y - offsetY) / scale
  };
}

function onWheel(e: WheelEvent) {
  //if (props.suspend) return;
  e.preventDefault();

  let zoomFactor: number;
  if (e.ctrlKey) {
    // macOS trackpad pinch-to-zoom
    zoomFactor = Math.pow(1.01, -e.deltaY);
  } else if (Number.isInteger(e.deltaY)) {
    // Likely trackpad scroll (integer deltas)
    zoomFactor = Math.pow(1.002, -e.deltaY);
  } else {
    // Normal mouse wheel scroll (non-integer)
    zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
  }

  smoothZoomAt(e.clientX, e.clientY, zoomFactor);
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  const pos = toImageCoords(e.clientX, e.clientY);
  emit('update:pos', pos);
}

let pointers = new Map<number, PointerEvent>();
let startDist = 0;
let startScale = 1;
let multiPointer = false;

function onDown(e: PointerEvent) {
  pointers.set(e.pointerId, e);
  if (pointers.size > 1) multiPointer = true;

  emit('pointerdown', e);
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  const pos = toImageCoords(e.clientX, e.clientY);
  emit('update:pos', pos);

  if (props.suspend) return;

  if (pointers.size === 1) {
    isPanning = true;
    vx = 0;
    vy = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = performance.now();
  } else {
    isPanning = false;
    if (pointers.size === 2) {
      const p = [...pointers.values()];
      if (p.length == 2 && p[0] && p[1]) {
        startDist = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
        startScale = scale;
      }
    }
  }
}

function onMove(e: PointerEvent) {
  emit('pointermove', e);
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  const pos = toImageCoords(e.clientX, e.clientY);
  emit('update:pos', pos);

  if (props.suspend) return;

  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, e);

  if (pointers.size === 1 && isPanning) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const now = performance.now();
    const dt = now - lastTime;

    offsetX += dx;
    offsetY += dy;
    constrain();

    if (dt > 0) {
      // Limit dt to avoid spikes
      const effectiveDt = Math.max(dt, 16);
      vx = dx / effectiveDt * 16;
      vy = dy / effectiveDt * 16;

      // If we hit a boundary, kill the velocity in that direction
      if (offsetX === 0 || offsetX === window.innerWidth - mapImage.width * scale) {
        // Only if we were actually trying to move further
        if ((offsetX === 0 && dx > 0) || (offsetX === window.innerWidth - mapImage.width * scale && dx < 0)) {
          vx = 0;
        }
      }
      if (offsetY === 0 || offsetY === window.innerHeight - mapImage.height * scale) {
        if ((offsetY === 0 && dy > 0) || (offsetY === window.innerHeight - mapImage.height * scale && dy < 0)) {
          vy = 0;
        }
      }
    }

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;
    redraw();
  } else if (pointers.size === 2) {
    const p = [...pointers.values()];

    if (p.length == 2 && p[0] && p[1]) {

      const dist = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);

      if (startDist > 0) {
        let newScale = (dist / startDist) * startScale;
        if (newScale > maxScale) newScale = maxScale;
        const zoomFactor = newScale / scale;

        zoomAt(
          (p[0].clientX + p[1].clientX) / 2,
          (p[0].clientY + p[1].clientY) / 2,
          zoomFactor
        );
        targetScale = scale; // Sync targetScale during pinch
        emit('update:zoom', scale);
      }
    }
  }
}

function onUp(e: PointerEvent) {
  if (!multiPointer) emit('pointerup', e);
  pointers.delete(e.pointerId);

  if (props.suspend) {
    if (pointers.size === 0) multiPointer = false;
    return;
  }

  if (pointers.size === 0) {
    multiPointer = false;
    if (!isAnimating && (isPanning && (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5))) {
      isAnimating = true;
      requestAnimationFrame(animate);
    }
    isPanning = false;
  } else if (pointers.size === 1) {
    // Reset pan start for the remaining pointer
    const remaining = [...pointers.values()][0];
    lastX = remaining!.clientX;
    lastY = remaining!.clientY;
    lastTime = performance.now();
    isPanning = true;
    vx = 0;
    vy = 0;
  }
  startDist = 0;
}

function animate() {
  let changed = false;
  const zoomRatio = 0.15; // Animation speed

  // 1. Handle Target-based Animation (Zoom and Offset)
  const isZooming = Math.abs(scale - targetScale) > 0.0001;
  const hasTargetOffset = targetOffsetX !== null && targetOffsetY !== null;
  const isMovingToTarget = hasTargetOffset && (Math.abs(offsetX - targetOffsetX!) > 0.1 || Math.abs(offsetY - targetOffsetY!) > 0.1);

  if (isZooming || isMovingToTarget) {
    if (isZooming) {
      const currentZoomFactor = 1 + (targetScale / scale - 1) * zoomRatio;
      if (!hasTargetOffset) {
        // Focal point zoom (wheel/pinch)
        offsetX = zoomFocalX - (zoomFocalX - offsetX) * currentZoomFactor;
        offsetY = zoomFocalY - (zoomFocalY - offsetY) * currentZoomFactor;
      }
      scale *= currentZoomFactor;
      if (Math.abs(scale - targetScale) <= 0.0001) scale = targetScale;
    }

    if (hasTargetOffset) {
      offsetX += (targetOffsetX! - offsetX) * zoomRatio;
      offsetY += (targetOffsetY! - offsetY) * zoomRatio;

      if (Math.abs(offsetX - targetOffsetX!) < 0.1) offsetX = targetOffsetX!;
      if (Math.abs(offsetY - targetOffsetY!) < 0.1) offsetY = targetOffsetY!;
    }

    constrain();
    emit('update:zoom', scale);
    changed = true;
  }

  // Clear targets once reached
  if (!isZooming && !isMovingToTarget) {
    targetOffsetX = null;
    targetOffsetY = null;
  }

  // 2. Handle Inertia (only if not interacting and no active target animation)
  if (pointers.size === 0 && !isMovingToTarget && !isZooming) {
    if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
      vx *= 0.95;
      vy *= 0.95;
      offsetX += vx;
      offsetY += vy;

      const oldX = offsetX;
      const oldY = offsetY;
      constrain();

      if (offsetX !== oldX) vx = 0;
      if (offsetY !== oldY) vy = 0;

      changed = true;
    } else {
      vx = 0;
      vy = 0;
    }
  }

  if (changed) {
    const pos = toImageCoords(lastMouseX, lastMouseY);
    emit('update:pos', pos);
    redraw();
    requestAnimationFrame(animate);
  } else {
    isAnimating = false;
  }
}

</script>

<template>
  <div class="viewport" :style="{ cursor: props.cursor }">
    <canvas id="map" ref="mapRef" :class="{ 'loaded': mapLoaded }"></canvas>
    <canvas id="overlay" ref="overlayRef" :class="{ 'loaded': mapLoaded }"></canvas>
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">Loading Map...</div>
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: loadProgress + '%' }"></div>
      </div>
      <div class="progress-text">{{ loadProgress }}%</div>
    </div>
  </div>
</template>

<style scoped>
.viewport {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #222;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
}

#map {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

#map.loaded {
  opacity: 1;
}

#overlay {
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

#overlay.loaded {
  opacity: 1;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  color: white;
  font-family: sans-serif;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.progress-bar-container {
  width: 200px;
  height: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-bar {
  height: 100%;
  background: #4caf50;
  transition: width 0.2s ease-out;
}

.progress-text {
  font-size: 0.9rem;
}
</style>
