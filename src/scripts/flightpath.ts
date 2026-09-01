import {distance} from "@/scripts/math.ts";

export interface ProfileWaypoint {
  x: number;
  y: number;
  z: number;
}


/**
 * Generates a profile visualization along a given path based on height mask data.
 *
 * @param {HTMLCanvasElement} profileCanvas - The canvas element to draw the profile on.
 * @param {string} heightMaskPath - The path to the height mask image file used as the source for height data.
 * @param {Point[]} waypoints - An array of coordinates representing the path for which the profile will be created. At least two waypoints are required.
 */
export async function drawProfileAlongPath(profileCanvas: HTMLCanvasElement, heightMaskPath: string, waypoints: ProfileWaypoint[]): Promise<void> {
  if (waypoints.length < 2) {
    throw new Error("At least two waypoints are required to create a profile.");
  }

  const profileWidth = profileCanvas.width;
  const profileHeight = profileCanvas.height;

  const maxHeight = 45000;
  const paddingLeft = 32;
  const plotLeft = paddingLeft;
  const plotWidth = profileWidth - paddingLeft;
  const plotHeight = profileHeight;

  // Use a temporary off-screen canvas to load the height mask and get its data
  const image = new Image();
  image.src = heightMaskPath;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = image.width;
  offscreenCanvas.height = image.height;
  const offscreenCtx = offscreenCanvas.getContext('2d');
  if (!offscreenCtx) throw new Error("Could not get 2d context for offscreen canvas");
  offscreenCtx.drawImage(image, 0, 0);

  const imageData = offscreenCtx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  const segmentDistances: number[] = [];
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = distance(waypoints[i + 1]!, waypoints[i]!)
    segmentDistances.push(dist);
    totalDistance += dist;
  }

  const profileCtx = profileCanvas.getContext('2d');
  if (!profileCtx) throw new Error("Could not get 2d context for profile canvas");

  const heights: number[] = [];
  const waypointXPositions: number[] = [plotLeft];
  let currentDistance = 0;

  for (let i = 0; i < segmentDistances.length; i++) {
    const start = waypoints[i]!;
    const end = waypoints[i + 1]!;
    const dist = segmentDistances[i]!;
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Determine how many steps for this segment relative to its share of total distance
    // We use a minimum of 1 step per segment to ensure it's at least represented
    const segmentWidth = (dist / totalDistance) * (plotWidth - 1);
    const steps = Math.max(1, Math.ceil(segmentWidth));

    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const px = Math.floor(start.x + dx * t);
      const py = Math.floor(start.y + dy * t);

      if (px >= 0 && px < image.width && py >= 0 && py < image.height) {
        const index = (py * image.width + px) * 4;
        const r = data[index]!;
        const g = data[index + 1]!;
        const b = data[index + 2]!;

        let heightInFeet: number;
        if (r === g && g === b) {
          heightInFeet = r * 100;
        } else {
          heightInFeet = (r + g * 256) * 100;
        }
        if (heightInFeet === 25500) {
          heightInFeet = 0;
        }
        heights.push(heightInFeet);
      } else {
        heights.push(0);
      }
    }
    currentDistance += dist;
    waypointXPositions.push(plotLeft + (currentDistance / totalDistance) * (plotWidth - 1));
  }

  createAltitudeBackground(profileCtx, {
    width: profileWidth,
    height: profileHeight,
    maxFeet: maxHeight,
    stepFeet: 5000,
    paddingLeft: paddingLeft
  })

  // Draw the profile area
  profileCtx.beginPath();
  profileCtx.moveTo(plotLeft, profileHeight);
  for (let i = 0; i < heights.length; i++) {
    const x = plotLeft + (i / (heights.length - 1)) * (plotWidth - 1);
    const k = 15000;
    const normalized = (Math.log(heights[i]! + k) - Math.log(k)) / (Math.log(maxHeight + k) - Math.log(k));
    const y = profileHeight - normalized * plotHeight;
    profileCtx.lineTo(x, y);
  }
  profileCtx.lineTo(profileWidth, profileHeight);
  profileCtx.lineTo(plotLeft, profileHeight);
  profileCtx.closePath();

  profileCtx.fillStyle = 'green';
  profileCtx.fill();

  profileCtx.strokeStyle = 'green';
  profileCtx.lineWidth = 2;
  profileCtx.stroke();

  // Draw vertical lines for waypoints
  profileCtx.strokeStyle = 'darkgray';
  profileCtx.lineWidth = 1;
  profileCtx.setLineDash([5, 5]);
  for (const x of waypointXPositions) {
    profileCtx.beginPath();
    profileCtx.moveTo(x, 0);
    profileCtx.lineTo(x, profileHeight);
    profileCtx.stroke();
  }
  profileCtx.setLineDash([]);
}

type AltitudeBackgroundOptions = {
  width?: number
  height?: number
  maxFeet?: number
  stepFeet?: number
  backgroundBottomColor?: string
  backgroundTopColor?: string
  lineColor?: string
  labelColor?: string
  font?: string
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
}

/**
 * Paints a scalable altitude background image with logarithmic vertical spacing.
 */
export function createAltitudeBackground(ctx: CanvasRenderingContext2D, options: AltitudeBackgroundOptions = {}) {
  const {
    width = 400,
    height = 300,
    maxFeet = 10,
    stepFeet = 2,
    backgroundBottomColor = '#182870',
    backgroundTopColor = '#000030',
    lineColor = '#808080',
    labelColor = '#b0b0b0',
    font = '11px Arial',
    paddingLeft = 0,
    paddingRight = 0,
    paddingTop = 0,
    paddingBottom = 0
  } = options

  const plotLeft = paddingLeft
  const plotTop = paddingTop
  const plotRight = width - paddingRight
  const plotBottom = height - paddingBottom
  const plotWidth = plotRight - plotLeft
  const plotHeight = plotBottom - plotTop

  const steps: number[] = []
  for (let feet = 0; feet <= maxFeet; feet += stepFeet) {
    steps.push(feet)
  }
  if (steps[steps.length - 1] !== maxFeet) {
    steps.push(maxFeet)
  }

  const hexToRgb = (hex: string) => {
    const normalized = hex.replace('#', '')
    const value = normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized

    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    }
  }

  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const mixColor = (c1: string, c2: string, t: number) => {
    const a = hexToRgb(c1)
    const b = hexToRgb(c2)
    return rgbToHex(
      lerp(a.r, b.r, t),
      lerp(a.g, b.g, t),
      lerp(a.b, b.b, t)
    )
  }

  const altitudeToY = (feet: number) => {
    const k = 15000;
    const normalized = (Math.log(feet + k) - Math.log(k)) / (Math.log(maxFeet + k) - Math.log(k));
    return plotBottom - normalized * plotHeight;
  }

  // Base fill
  ctx.fillStyle = backgroundBottomColor
  ctx.fillRect(0, 0, width, height)

  // Draw logarithmic bands
  for (let i = 0; i < steps.length - 1; i++) {
    const bottomFeet = steps[i]!
    const topFeet = steps[i + 1]!

    const y1 = altitudeToY(bottomFeet)
    const y2 = altitudeToY(topFeet)

    const t = bottomFeet / maxFeet
    ctx.fillStyle = mixColor(backgroundBottomColor, backgroundTopColor, t)
    ctx.fillRect(plotLeft, y2, plotWidth, y1 - y2)
  }

  // Draw border area background behind labels if you want a cleaner left margin
  ctx.fillStyle = '#101020'
  ctx.fillRect(0, 0, plotLeft, height)

  // Grid lines + labels
  ctx.strokeStyle = lineColor
  ctx.fillStyle = labelColor
  ctx.font = font
  ctx.lineWidth = 1
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  for (const feet of steps) {
    const y = altitudeToY(feet)

    ctx.beginPath()
    ctx.moveTo(plotLeft, y)
    ctx.lineTo(plotRight, y)
    ctx.stroke()

    // Don't draw the 0K and the last height label as they don't fit
    if (feet !== 0 && feet !== maxFeet) {
      const label = feet === 0 ? '0K' : `${Math.round(feet / 1000)}K`
      ctx.fillText(label, plotLeft - 6, y)
    }
  }

  // Outer frame
  ctx.strokeStyle = '#606060'
  ctx.strokeRect(plotLeft, plotTop, plotWidth, plotHeight)
}
