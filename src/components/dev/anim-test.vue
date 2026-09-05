<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

// References to the canvas elements in the template
const mapRef = ref<HTMLCanvasElement | null>(null);
const overlayRef = ref<HTMLCanvasElement | null>(null);

let mapAnimationFrameId: number | null = null;
let overlayAnimationFrameId: number | null = null;

// --- Map Canvas Animation State (Clockwise rotating & orbiting rectangle) ---
let orbitAngle = 0; // Current angle (radians) for orbiting around the center
let selfAngle = 0;  // Current angle (radians) for self-rotation

const ORBIT_RADIUS = 150;     // Distance (150px) from center
const CENTER_RECT_SIZE = 100; // Dimensions (100x100 px) of center rect
const ORBIT_RECT_SIZE = 50;   // Dimensions (50x50 px) of orbiting rect
const ORBIT_SPEED = 0.015;    // Orbit angular velocity (rad/frame, CW)
const SELF_ROT_SPEED = 0.04;  // Self-rotation angular velocity (rad/frame)

// --- Overlay Canvas Animation State (Counter-Clockwise orbiting triangle) ---
let overlayOrbitAngle = 0;           // Current angle (radians) for CCW orbit
const OVERLAY_ORBIT_RADIUS = 220;    // Distance from center on overlay canvas
const TRIANGLE_SIZE = 40;            // Dimensions of the triangle
const OVERLAY_ORBIT_SPEED = 0.02;    // CCW orbit angular velocity (rad/frame)

/**
 * Resize canvas to match the window viewport dimensions and display density.
 */
function resizeCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * Main animation loop for the map canvas (center rect + CW orbiting rect)
 */
function renderMap(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  // 1. CLEAR FRAME: Clear entire map canvas before drawing next frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // 2. DRAW CENTER RECTANGLE (100x100 px placed in the center of the canvas)
  ctx.save();
  ctx.fillStyle = '#333344';
  // Draw centered at (centerX, centerY)
  ctx.fillRect(
    centerX - CENTER_RECT_SIZE / 2,
    centerY - CENTER_RECT_SIZE / 2,
    CENTER_RECT_SIZE,
    CENTER_RECT_SIZE
  );
  ctx.restore();

  // 3. DRAW ORBITING & ROTATING RECTANGLE (50x50 px white rect)
  // Calculate position along circular orbit at radius 150px
  const orbitX = centerX + Math.cos(orbitAngle) * ORBIT_RADIUS;
  const orbitY = centerY + Math.sin(orbitAngle) * ORBIT_RADIUS;

  ctx.save();
  // Move context origin to the center of the orbiting rectangle
  ctx.translate(orbitX, orbitY);
  // Rotate context around the orbiting rectangle's own center
  ctx.rotate(selfAngle);

  // Draw the white rectangle centered on local origin (0, 0)
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(
    -ORBIT_RECT_SIZE / 2,
    -ORBIT_RECT_SIZE / 2,
    ORBIT_RECT_SIZE,
    ORBIT_RECT_SIZE
  );
  ctx.restore();

  // 4. UPDATE ANIMATION STATE (Clockwise: increment angle)
  orbitAngle += ORBIT_SPEED;
  selfAngle += SELF_ROT_SPEED;

  // 5. REQUEST NEXT FRAME
  mapAnimationFrameId = requestAnimationFrame(() => renderMap(canvas, ctx));
}

/**
 * Animation loop for the overlay canvas (CCW orbiting triangle)
 */
function renderOverlay(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  // 1. CLEAR FRAME: Clear entire overlay canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // 2. CALCULATE POSITION along circular orbit
  const orbitX = centerX + Math.cos(overlayOrbitAngle) * OVERLAY_ORBIT_RADIUS;
  const orbitY = centerY + Math.sin(overlayOrbitAngle) * OVERLAY_ORBIT_RADIUS;

  // 3. DRAW TRIANGLE at current orbit position
  ctx.save();
  ctx.translate(orbitX, orbitY);

  ctx.beginPath();
  ctx.moveTo(0, -TRIANGLE_SIZE / 2);
  ctx.lineTo(TRIANGLE_SIZE / 2, TRIANGLE_SIZE / 2);
  ctx.lineTo(-TRIANGLE_SIZE / 2, TRIANGLE_SIZE / 2);
  ctx.closePath();

  ctx.fillStyle = '#ffcc00';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 4. UPDATE ANIMATION STATE (Counter-Clockwise: decrement angle)
  overlayOrbitAngle -= OVERLAY_ORBIT_SPEED;

  // 5. REQUEST NEXT FRAME
  overlayAnimationFrameId = requestAnimationFrame(() => renderOverlay(canvas, ctx));
}

function handleResize() {
  if (mapRef.value) {
    resizeCanvas(mapRef.value);
  }
  if (overlayRef.value) {
    resizeCanvas(overlayRef.value);
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);

  // Initialize and start Map Canvas animation loop
  if (mapRef.value) {
    const mapCtx = mapRef.value.getContext('2d');
    if (mapCtx) {
      resizeCanvas(mapRef.value);
      mapAnimationFrameId = requestAnimationFrame(() => renderMap(mapRef.value!, mapCtx));
    }
  }

  // Initialize and start Overlay Canvas animation loop
  if (overlayRef.value) {
    const overlayCtx = overlayRef.value.getContext('2d');
    if (overlayCtx) {
      resizeCanvas(overlayRef.value);
      overlayAnimationFrameId = requestAnimationFrame(() => renderOverlay(overlayRef.value!, overlayCtx));
    }
  }
});

onUnmounted(() => {
  // Clean up: cancel both active animation frames and remove listeners
  if (mapAnimationFrameId !== null) {
    cancelAnimationFrame(mapAnimationFrameId);
  }
  if (overlayAnimationFrameId !== null) {
    cancelAnimationFrame(overlayAnimationFrameId);
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="viewport">
    <canvas id="map" ref="mapRef"></canvas>
    <canvas id="overlay" ref="overlayRef"></canvas>
  </div>
</template>

<style scoped>
.viewport {
  user-select: none;
  -webkit-user-select: none;
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #aad;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
