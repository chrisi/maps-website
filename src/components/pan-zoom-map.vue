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
import {ref, computed, onMounted} from "vue";

defineProps({src: String});
const emit = defineEmits(['pan-halt']);

const container = ref<HTMLDivElement>();
const img = ref<HTMLImageElement>();
const canvasRef = ref<HTMLCanvasElement>();

let startDist = 0;
let startX = 0;
let startY = 0;

const scale = ref(1);
const minScale = 1;
const maxScale = 8;

let targetScale = 1;
let zoomMouseX = 0;
let zoomMouseY = 0;

let pinch = false

const x = ref(0);
const y = ref(0);

let isMousePanning = false;

// inertia state
let lastTouchX = 0;
let lastTouchY = 0;
let velocityX = 0;
let velocityY = 0;
let lastMoveTime = 0;
let animationFrameId: number | null = null;

onMounted(() => {
  drawCanvas();
});

function drawCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  // Set canvas internal resolution to match a reference size (e.g., container size)
  // These lines will stay "anchored" to the image as it scales
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
  const friction = 0.95; // Resistance (0 to 1)
  const stopThreshold = 0.1;
  const zoomSmoothing = 0.15; // Smoothness (0 to 1, lower is smoother)

  const step = () => {
    let continues = false;

    // Inertia Panning
    if (Math.abs(velocityX) > stopThreshold || Math.abs(velocityY) > stopThreshold) {
      velocityX *= friction;
      velocityY *= friction;
      x.value += velocityX;
      y.value += velocityY;
      continues = true;
    }

    // Smooth Zooming
    if (Math.abs(scale.value - targetScale) > 0.001) {
      const prevScale = scale.value;
      // Linear interpolation towards target
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
      emit('pan-halt', { x: x.value, y: y.value, scale: scale.value });
    }
  };

  animationFrameId = requestAnimationFrame(step);
}

function getMidpoint(touches: TouchList) {
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
  const c = container.value!.getBoundingClientRect();
  const imgW = c.width * scale.value;
  const imgH = c.height * scale.value;

  // calculate bounds:
  // if img is wider than container, x can range from (containerWidth - imgWidth) to 0.
  // if img is smaller, we force it to a specific position (e.g., center or 0).

  let minX = c.width - imgW;
  let minY = c.height - imgH;
  let maxX = 0;
  let maxY = 0;

  // center, if the image is smaller than the container
  if (imgW < c.width) {
    const centerOffset = (c.width - imgW) / 2;
    minX = maxX = centerOffset;
  }
  if (imgH < c.height) {
    const centerOffset = (c.height - imgH) / 2;
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

  targetScale = scale.value; // Sync target on touch

  if (e.touches.length === 2) {
    pinch = true
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
    const d = getDistance(e.touches);
    const mid = getMidpoint(e.touches);

    const prevScale = scale.value;
    const newScale = Math.min(maxScale, Math.max(minScale, scale.value * (d / startDist)));

    // calculate the ratio of the scale change
    const scaleRatio = newScale / prevScale;

    // zoom toward the midpoint:
    x.value = mid.x - (mid.x - x.value) * scaleRatio;
    y.value = mid.y - (mid.y - y.value) * scaleRatio;

    scale.value = newScale;
    targetScale = newScale; // Keep target in sync during pinch
    startDist = d;
    clampPan();
  }

  // pinch: prevent unintentional jump/panning if fingers are not
  // lifted synchronously after a pinch operation
  if (!pinch && e.touches.length === 1 && scale.value > 1) {
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
    if (!pinch && scale.value > 1 && (Math.abs(velocityX) > 2 || Math.abs(velocityY) > 2)) {
      startInertia();
    }else {
      // If there was no inertia to start, the pan has effectively halted immediately
      emit('pan-halt', { x: x.value, y: y.value, scale: scale.value });
    }
    pinch = false;
  }
}

function onWheel(e: WheelEvent) {
  const delta = -e.deltaY;
  const factor = 1.3; // Slightly higher factor for better feel with smoothing
  const zoom = delta > 0 ? factor : 1 / factor;

  // Update target scale instead of immediate scale
  targetScale = Math.min(maxScale, Math.max(minScale, targetScale * zoom));

  // Capture mouse position for the zoom anchor
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
      emit('pan-halt', { x: x.value, y: y.value, scale: scale.value });
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
  object-fit: contain;
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
