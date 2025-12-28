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
    style="width: 100%; height: 95vh"
  >
    <div :style="transformStyle" class="transform-layer">
      <img
        ref="img"
        :src="src"
        class="image"
        draggable="false"
        @load="onImageLoad"
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

const panButton = 0; // 0=left,1=middle;2=right

let startDist = 0;
let startX = 0;
let startY = 0;

let targetScale = 1;
let zoomMouseX = 0;
let zoomMouseY = 0;

const minScale = ref(0.1);
const maxScale = 4;

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
  resetZoom,
  getContext: () => canvasRef.value?.getContext('2d'),
  scale,
  x,
  y
});

onMounted(() => {
  updateMinScale();
  updateCanvasSize();
});

// emit change event whenever coordinates or scale update
watch([x, y, scale], () => {
  emit('change', getViewportCenterMapPos());
});


function onImageLoad() {
  updateMinScale();
  updateCanvasSize();
}

function updateCanvasSize() {
  const rect = container.value?.getBoundingClientRect();
  if (rect && canvasRef.value) {
    const currentScale = scale.value;
    const currentX = x.value;
    const currentY = y.value;

    canvasRef.value.width = rect.width;
    canvasRef.value.height = rect.height;

    canvasRef.value.style.width = `${rect.width / currentScale}px`;
    canvasRef.value.style.height = `${rect.height / currentScale}px`;
    canvasRef.value.style.left = `${-currentX / currentScale}px`;
    canvasRef.value.style.top = `${-currentY / currentScale}px`;

    console.log('Canvas regenerated: viewport-sized, 1:1 pixel exact at scale', currentScale);
  }
}

function updateMinScale() {
  const rect = container.value?.getBoundingClientRect();
  if (rect && img.value) {
    const imgWidth = img.value.naturalWidth || 6144;
    const imgHeight = img.value.naturalHeight || 6144;
    const effectiveMinScale = Math.max(rect.width / imgWidth, rect.height / imgHeight);
    minScale.value = effectiveMinScale;
    if (scale.value < effectiveMinScale) {
      scale.value = effectiveMinScale;
      targetScale = effectiveMinScale;
    }
  }
  clampPan();
}

function getViewportCenterMapPos() {
  const rect = container.value?.getBoundingClientRect();
  const imageElement = img.value;
  let mapX = 0;
  let mapY = 0;

  if (rect && imageElement) {
    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;

    if (naturalWidth > 0 && naturalHeight > 0) {
      mapX = (rect.width / 2 - x.value) / scale.value;
      mapY = (rect.height / 2 - y.value) / scale.value;
    }
  }
  return {
    x: Number(mapX.toFixed(2)),
    y: Number(mapY.toFixed(2)),
    scale: Number(scale.value.toFixed(2))
  };
}

function resetZoom() {
  const rect = container.value?.getBoundingClientRect();
  if (!rect || !img.value) return;

  targetScale = minScale.value;
  // Center it
  zoomMouseX = rect.width / 2;
  zoomMouseY = rect.height / 2;

  if (!animationFrameId) {
    startInertia();
  }
}

/**
 * Set zoom level from outside.
 * @param newScale The target scale level.
 * @param mapX Optional X coordinate on the original image pixels.
 * @param mapY Optional Y coordinate on the original image pixels.
 */
function setZoom(newScale: number, mapX?: number, mapY?: number) {
  const rect = container.value?.getBoundingClientRect();
  const imageElement = img.value;
  if (!rect || !imageElement) return;

  targetScale = Math.min(maxScale, Math.max(minScale.value, newScale));

  if (mapX !== undefined && mapY !== undefined) {
    // calculate the target x and y such that the specified map coordinate
    // will land in the center of the viewport at targetScale.
    const targetX = rect.width / 2 - (mapX * targetScale);
    const targetY = rect.height / 2 - (mapY * targetScale);

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

  if (!animationFrameId) {
    startInertia();
  }
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
      clampPan();
      animationFrameId = null;
      updateCanvasSize();
      emit('pan-stopped', getViewportCenterMapPos());
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
  const rect = container.value?.getBoundingClientRect();
  if (!rect || !img.value) return;

  const imageWidth = (img.value.naturalWidth || 6144) * scale.value;
  const imageHeight = (img.value.naturalHeight || 6144) * scale.value;

  // If image is wider than container, clamp x between (containerWidth - imageWidth) and 0
  if (imageWidth > rect.width) {
    x.value = Math.max(Math.min(0, x.value), rect.width - imageWidth);
  } else {
    // If image is smaller than container, center it
    x.value = (rect.width - imageWidth) / 2;
  }

  if (imageHeight > rect.height) {
    y.value = Math.max(Math.min(0, y.value), rect.height - imageHeight);
  } else {
    y.value = (rect.height - imageHeight) / 2;
  }
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
  } else if (e.touches.length === 1) {
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
    const newScale = Math.min(maxScale, Math.max(minScale.value, scale.value * (dist / startDist)));
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
  if (!isPinching && e.touches.length === 1) {
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
    if (!isPinching && (Math.abs(velocityX) > 2 || Math.abs(velocityY) > 2)) {
      startInertia();
    } else {
      // if there was no inertia to start, the pan has effectively stopped immediately
      updateCanvasSize();
      emit('pan-stopped', getViewportCenterMapPos());
    }
    isPinching = false;
  }
}

function onWheel(e: WheelEvent) {
  const delta = -e.deltaY;
  const factor = 1.2;
  const zoom = delta > 0 ? factor : 1 / factor;

  // update target scale instead of immediate scale
  targetScale = Math.min(maxScale, Math.max(minScale.value, targetScale * zoom));

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
  if (e.button === panButton) {
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

function onMouseUp() {
  if (isMousePanning) {
    isMousePanning = false;
    if (Math.abs(velocityX) > 2 || Math.abs(velocityY) > 2) {
      startInertia();
    } else {
      updateCanvasSize();
      emit('pan-stopped', getViewportCenterMapPos());
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
  overflow: hidden;
  touch-action: none;
  position: relative;
}

.transform-layer {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
  pointer-events: none; /* Let touches pass through to container */
}

.image {
  display: block;
}

.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>
