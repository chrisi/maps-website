<script setup lang="ts">

import {onMounted, ref, watch} from "vue";

const props = defineProps<{
  src: string
}>()

const emit = defineEmits<{
  (e: 'update:zoom', zoom: number): void
  (e: 'update:pos', x: number, y: number): void
  (e: 'redraw', ctx: CanvasRenderingContext2D, offset: { x: number, y: number }, scale: number): void
}>()

const mapRef = ref<HTMLCanvasElement | null>(null)
const overlayRef = ref<HTMLCanvasElement | null>(null)

let ctx: CanvasRenderingContext2D | null = null;
const mapImage = new Image();

watch(() => props.src, (newSrc) => {
  mapImage.src = newSrc;
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
let zoomFocalX = 0;
let zoomFocalY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let isAnimating = false;

onMounted(() => {
  if (!mapRef.value)
    return
  ctx = mapRef.value.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  window.addEventListener("resize", resize);
  resize();

  mapRef.value.style.touchAction = 'none'
  mapRef.value.addEventListener("pointerdown", onDown);
  mapRef.value.addEventListener("pointermove", onMove);
  mapRef.value.addEventListener("pointerup", onUp);
  mapRef.value.addEventListener("pointercancel", onUp);
  mapRef.value.addEventListener("wheel", onWheel, {passive: false});

  mapImage.onload = () => {
    // Center image initially
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    scale = Math.min(vw / mapImage.width, vh / mapImage.height);
    targetScale = scale;
    constrain();
    redraw();
    emit('update:zoom', scale);
  };
  mapImage.src = props.src;
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
  if (!ctx || !mapRef.value) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  ctx.clearRect(0, 0, vw, vh);
  ctx.drawImage(mapImage, offsetX, offsetY, mapImage.width * scale, mapImage.height * scale);

  emit('redraw', ctx, {x: -offsetX / scale, y: -offsetY / scale}, scale);
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
  e.preventDefault();
  const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
  smoothZoomAt(e.clientX, e.clientY, zoomFactor);
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  const coords = toImageCoords(e.clientX, e.clientY);
  emit('update:pos', coords.x, coords.y);
}

let pointers = new Map<number, PointerEvent>();
let startDist = 0;
let startScale = 1;

function onDown(e: PointerEvent) {
  pointers.set(e.pointerId, e);
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  const coords = toImageCoords(e.clientX, e.clientY);
  emit('update:pos', coords.x, coords.y);
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
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  const coords = toImageCoords(e.clientX, e.clientY);
  emit('update:pos', coords.x, coords.y);

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
        const newScale = (dist / startDist) * startScale;
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
  pointers.delete(e.pointerId);
  if (pointers.size === 0) {
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

  // Handle Zoom
  if (Math.abs(scale - targetScale) > 0.0001) {
    const zoomRatio = 0.15; // Animation speed
    const currentZoomFactor = 1 + (targetScale / scale - 1) * zoomRatio;

    const newScale = scale * currentZoomFactor;

    offsetX = zoomFocalX - (zoomFocalX - offsetX) * currentZoomFactor;
    offsetY = zoomFocalY - (zoomFocalY - offsetY) * currentZoomFactor;
    scale = newScale;
    constrain();
    emit('update:zoom', scale);
    changed = true;
  } else {
    if (scale !== targetScale) {
      scale = targetScale;
      constrain();
      emit('update:zoom', scale);
      changed = true;
    }
  }

  // Handle Inertia (only if not multi-touching)
  if (pointers.size === 0) {
    if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
      vx *= 0.95;
      vy *= 0.95;
      offsetX += vx;
      offsetY += vy;

      const oldX = offsetX;
      const oldY = offsetY;
      constrain();

      // If constrain changed the offset, it means we hit a wall
      if (offsetX !== oldX) vx = 0;
      if (offsetY !== oldY) vy = 0;

      changed = true;
    } else {
      vx = 0;
      vy = 0;
    }
  }

  if (changed) {
    const coords = toImageCoords(lastMouseX, lastMouseY);
    emit('update:pos', coords.x, coords.y);
    redraw();
    requestAnimationFrame(animate);
  } else {
    isAnimating = false;
  }
}

</script>

<template>
  <div class="viewport">
    <canvas id="map" ref="mapRef"></canvas>
    <canvas id="overlay" ref="overlayRef"></canvas>
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

#overlay {
  pointer-events: none;
}
</style>
