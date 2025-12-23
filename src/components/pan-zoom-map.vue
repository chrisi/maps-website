<template>
  <div
    ref="container"
    class="container"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @wheel.prevent="onWheel"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
  >
    <div :style="transformStyle" class="transform-layer">
      <img
        ref="img"
        :src="src"
        class="image"
        draggable="false"
      />
      <canvas ref="canvasRef" class="overlay-canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue";

defineProps({src: String});
const emit = defineEmits(['pan-stopped', 'change']);

const container = ref<HTMLDivElement>();
const img = ref<HTMLImageElement>();
const canvasRef = ref<HTMLCanvasElement>();

let startDist = 0;
let startX = 0;
let startY = 0;

let targetScale = 1;
let zoomMouseX = 0;
let zoomMouseY = 0;

const minScale = 1;
const maxScale = 12;

let isMousePanning = false;
let isPinching = false

// inertia state
let lastTouchX = 0;
let lastTouchY = 0;
let velocityX = 0;
let velocityY = 0;
let lastMoveTime = 0;
let animationFrameId: number | null = null;

const scale = ref(1);
const x = ref(0);
const y = ref(0);

defineExpose({
  setZoom,
  scale,
  x,
  y
});

onMounted(() => {
  drawCanvas();
});

// emit change event whenever coordinates or scale update
watch([x, y, scale], ([newX, newY, newScale]) => {
  const rect = container.value?.getBoundingClientRect();
  const imageElement = img.value;

  let mapX = 0;
  let mapY = 0;

  if (rect && imageElement) {
    // find the actual displayed size of the image
    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;

    // contain logic to find the 'base' scale (see CSS: object-fit: contain)
    // TODO: Since the image is using object-fit: contain, CSS shrinks or grows it to fit the container. We need this ratio to map screen pixels back to image pixels.
    const baseScale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);

    // calculate offsets if the contained image doesn't fill the container (centering)
    const baseWidth = naturalWidth * baseScale;
    const baseHeight = naturalHeight * baseScale;
    const offsetX = (rect.width - baseWidth) / 2;
    const offsetY = (rect.height - baseHeight) / 2;

    // find the center of the viewport in 'source pixel' space
    mapX = ((rect.width / 2 - newX - (offsetX * newScale)) / newScale) / baseScale;
    mapY = ((rect.height / 2 - newY - (offsetY * newScale)) / newScale) / baseScale;
  }

  emit('change', {
      x: Number(mapX.toFixed(2)),
      y: Number(mapY.toFixed(2)),
      scale: Number(newScale.toFixed(2))
    }
  );
});

/**
 * Set zoom level from outside.
 * @param newScale The target scale level.
 // * @param centerX Optional X coordinate to zoom toward (container relative). Defaults to center.
 // * @param centerY Optional Y coordinate to zoom toward (container relative). Defaults to center.
 * @param mapX Optional X coordinate on the original image pixels.
 * @param mapY Optional Y coordinate on the original image pixels.
 */
function setZoom(newScale: number, mapX?: number, mapY?: number) {
  const rect = container.value?.getBoundingClientRect();
  const imageElement = img.value;
  if (!rect || !imageElement) return;

  targetScale = Math.min(maxScale, Math.max(minScale, newScale));

  if (mapX !== undefined && mapY !== undefined) {
    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;
    const baseScale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
    const offsetX = (rect.width - naturalWidth * baseScale) / 2;
    const offsetY = (rect.height - naturalHeight * baseScale) / 2;

    // calculate the zoom anchor (zoomMouseX/Y) such that zooming to targetScale
    // will land the specified map coordinate in the center of the viewport.
    const targetX = rect.width / 2 - (mapX * baseScale * targetScale) - (offsetX * targetScale);
    const targetY = rect.height / 2 - (mapY * baseScale * targetScale) - (offsetY * targetScale);

    // to reach targetX/Y exactly using the smooth zoom formula:
    // x_final = zoomMouseX - (zoomMouseX - x_current) * (targetScale / currentScale)
    // solve for zoomMouseX:
    const scaleRatio = targetScale / scale.value;
    zoomMouseX = (targetX - x.value * scaleRatio) / (1 - scaleRatio);
    zoomMouseY = (targetY - y.value * scaleRatio) / (1 - scaleRatio);

    // Handle division by zero if scale hasn't changed
    if (Math.abs(1 - scaleRatio) < 0.0001) {
      zoomMouseX = rect.width / 2;
      zoomMouseY = rect.height / 2;
    }
  } else {
    zoomMouseX = rect.width / 2;
    zoomMouseY = rect.height / 2;
  }

  // **** calculation based on viewport size ****
  // const rect = container.value?.getBoundingClientRect();
  // if (rect) {
  //   zoomMouseX = centerX ?? rect.width / 2;
  //   zoomMouseY = centerY ?? rect.height / 2;
  // }

  if (!animationFrameId) {
    startInertia();
  }
}

function drawCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  // set canvas internal resolution to match a reference size (e.g., container size)
  // these lines will stay "anchored" to the image as it scales
  canvas.width = 1000;
  canvas.height = 1000;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = 10;

  // Draw a couple of lines
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(900, 900);
  ctx.stroke();

  ctx.strokeStyle = 'magenta';
  ctx.beginPath();
  ctx.moveTo(900, 100);
  ctx.lineTo(100, 900);
  ctx.stroke();
}

function startInertia() {
  const friction = 0.95; // resistance (0 to 1)
  const zoomSmoothing = 0.15; // smoothness (0 to 1, lower is smoother)
  const stopThreshold = 0.1;

  const step = () => {
    let continues = false;

    // inertia panning
    if (Math.abs(velocityX) > stopThreshold || Math.abs(velocityY) > stopThreshold) {
      velocityX *= friction;
      velocityY *= friction;
      x.value += velocityX;
      y.value += velocityY;
      continues = true;
    }

    // smooth zooming
    if (Math.abs(scale.value - targetScale) > 0.001) {
      const prevScale = scale.value;
      // linear interpolation towards target
      scale.value += (targetScale - scale.value) * zoomSmoothing;

      const scaleRatio = scale.value / prevScale;
      x.value = zoomMouseX - (zoomMouseX - x.value) * scaleRatio;
      y.value = zoomMouseY - (zoomMouseY - y.value) * scaleRatio;
      continues = true;
    }

    if (continues) {
      clampPan();
      animationFrameId = requestAnimationFrame(step);
    } else {
      animationFrameId = null;
      emit('pan-stopped', {x: x.value, y: y.value, scale: scale.value});
    }
  };

  animationFrameId = requestAnimationFrame(step);
}

function getPinchMidpoint(touches: TouchList) {
  return {
    x: (touches[0]!.clientX + touches[1]!.clientX) / 2,
    y: (touches[0]!.clientY + touches[1]!.clientY) / 2
  };
}

function getDistance(touches: TouchList) {
  const dx = touches[0]!.clientX - touches[1]!.clientX;
  const dy = touches[0]!.clientY - touches[1]!.clientY;
  return Math.hypot(dx, dy);
}

function clampPan() {
  const clientRect = container.value!.getBoundingClientRect();
  const imgW = clientRect.width * scale.value;
  const imgH = clientRect.height * scale.value;

  // calculate bounds:
  // if img is wider than container, x can range from (containerWidth - imgWidth) to 0.
  // if img is smaller, we force it to a specific position (e.g., center or 0).

  let minX = clientRect.width - imgW;
  let minY = clientRect.height - imgH;
  let maxX = 0;
  let maxY = 0;

  // center, if the image is smaller than the container
  if (imgW < clientRect.width) {
    const centerOffset = (clientRect.width - imgW) / 2;
    minX = maxX = centerOffset;
  }
  if (imgH < clientRect.height) {
    const centerOffset = (clientRect.height - imgH) / 2;
    minY = maxY = centerOffset;
  }

  x.value = Math.min(maxX, Math.max(minX, x.value));
  y.value = Math.min(maxY, Math.max(minY, y.value));
}

function onTouchStart(e: TouchEvent) {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  targetScale = scale.value; // sync target on touch

  if (e.touches.length === 2) {
    isPinching = true
    startDist = getDistance(e.touches);
  } else if (e.touches.length === 1 && scale.value > 1) {
    startX = e.touches[0]!.clientX - x.value;
    startY = e.touches[0]!.clientY - y.value;

    lastTouchX = e.touches[0]!.clientX;
    lastTouchY = e.touches[0]!.clientY;
    lastMoveTime = performance.now();
    velocityX = 0;
    velocityY = 0;
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dist = getDistance(e.touches);
    const mid = getPinchMidpoint(e.touches);

    const prevScale = scale.value;
    const newScale = Math.min(maxScale, Math.max(minScale, scale.value * (dist / startDist)));
    const scaleRatio = newScale / prevScale;

    x.value = mid.x - (mid.x - x.value) * scaleRatio;
    y.value = mid.y - (mid.y - y.value) * scaleRatio;

    scale.value = newScale;
    targetScale = newScale; // keep target in sync during pinch
    startDist = dist;
    clampPan();
  }

  // pinch: prevent unintentional jump/panning if fingers are not
  // lifted synchronously after a pinch operation
  if (!isPinching && e.touches.length === 1 && scale.value > 1) {
    e.preventDefault();
    const touch = e.touches[0]!;
    const now = performance.now();
    const dt = now - lastMoveTime;

    if (dt > 0) {
      // calculate velocity (pixels per frame/ms)
      velocityX = (touch.clientX - lastTouchX);
      velocityY = (touch.clientY - lastTouchY);
    }

    x.value = touch.clientX - startX;
    y.value = touch.clientY - startY;

    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
    lastMoveTime = now;

    clampPan();
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) {
    if (!isPinching && scale.value > 1 && (Math.abs(velocityX) > 2 || Math.abs(velocityY) > 2)) {
      startInertia();
    } else {
      // if there was no inertia to start, the pan has effectively stopped immediately
      emit('pan-stopped', {x: x.value, y: y.value, scale: scale.value});
    }
    isPinching = false;
  }
}

function onWheel(e: WheelEvent) {
  const delta = -e.deltaY;
  const factor = 1.2;
  const zoom = delta > 0 ? factor : 1 / factor;

  // update target scale instead of immediate scale
  targetScale = Math.min(maxScale, Math.max(minScale, targetScale * zoom));

  // capture mouse position for the zoom anchor
  const rect = container.value!.getBoundingClientRect();
  zoomMouseX = e.clientX - rect.left;
  zoomMouseY = e.clientY - rect.top;

  if (!animationFrameId) {
    startInertia();
  }
}

function onMouseDown(e: MouseEvent) {
  // Button 1 is the middle mouse button (mouse wheel click)
  if (e.button === 1) {
    e.preventDefault();
    isMousePanning = true;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    startX = e.clientX - x.value;
    startY = e.clientY - y.value;
    targetScale = scale.value; // Sync target on click
    lastTouchX = e.clientX;
    lastTouchY = e.clientY;
    lastMoveTime = performance.now();
    velocityX = 0;
    velocityY = 0;
  }
}

function onMouseMove(e: MouseEvent) {
  if (!isMousePanning) return;

  const now = performance.now();
  const dt = now - lastMoveTime;

  if (dt > 0) {
    velocityX = (e.clientX - lastTouchX);
    velocityY = (e.clientY - lastTouchY);
  }

  x.value = e.clientX - startX;
  y.value = e.clientY - startY;

  lastTouchX = e.clientX;
  lastTouchY = e.clientY;
  lastMoveTime = now;

  clampPan();
}

function onMouseUp(e: MouseEvent) {
  if (isMousePanning) {
    isMousePanning = false;
    if (Math.abs(velocityX) > 2 || Math.abs(velocityY) > 2) {
      startInertia();
    } else {
      emit('pan-stopped', {x: x.value, y: y.value, scale: scale.value});
    }
  }
}

const transformStyle = computed(() => ({
  transform: `translate(${x.value}px, ${y.value}px) scale(${scale.value})`
}));
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}
</style>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
  background: #000;
  position: relative;
}

.transform-layer {
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
  will-change: transform;
  pointer-events: none; /* Let touches pass through to container */
}

.image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* TODO: check contain necessary */
  display: block;
}

.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
