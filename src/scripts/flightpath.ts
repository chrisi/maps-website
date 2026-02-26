import {createCanvas, loadImage} from 'canvas';

/**
 * Creates a height profile image along a given path and returns it as a base64 data URL.
 *
 * @param heightMaskPath Path to the heightmask image (e.g., 'public/heightmasks/balkans.png')
 * @param waypoints Array of { x: number, y: number } coordinates on the map
 * @returns A PNG data URL string (e.g., "data:image/png;base64,.....")
 */
export async function createProfileAlongPath(
  heightMaskPath: string,
  waypoints: { x: number, y: number }[]
) {
  if (waypoints.length < 2) {
    throw new Error("At least two waypoints are required to create a profile.");
  }

  const image = await loadImage(heightMaskPath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  const segmentDistances: number[] = [];
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1]!.x - waypoints[i]!.x;
    const dy = waypoints[i + 1]!.y - waypoints[i]!.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    segmentDistances.push(dist);
    totalDistance += dist;
  }

  const profileWidth = 800;
  const profileHeight = 300; // Adjusted height to match common profile displays
  const profileCanvas = createCanvas(profileWidth, profileHeight);
  const profileCtx = profileCanvas.getContext('2d');

  const heights: number[] = [];
  const waypointXPositions: number[] = [0];
  let currentDistance = 0;

  for (let i = 0; i < segmentDistances.length; i++) {
    const start = waypoints[i]!;
    const end = waypoints[i + 1]!;
    const dist = segmentDistances[i]!;
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Determine how many steps for this segment relative to its share of total distance
    // We use a minimum of 1 step per segment to ensure it's at least represented
    const segmentWidth = (dist / totalDistance) * (profileWidth - 1);
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
    waypointXPositions.push((currentDistance / totalDistance) * (profileWidth - 1));
  }

  // Determine max height for scaling
  //const maxHeight = heights.length > 0 ? Math.max(...heights) : 10000;
  const maxHeight = 25000;

  // Background
  profileCtx.fillStyle = 'lightblue'; // Dark background
  profileCtx.fillRect(0, 0, profileWidth, profileHeight);

  // Draw the profile area
  profileCtx.beginPath();
  profileCtx.moveTo(0, profileHeight);
  for (let i = 0; i < heights.length; i++) {
    const x = (i / (heights.length - 1)) * (profileWidth - 1);
    const displayHeight = (heights[i]! / maxHeight) * (profileHeight - 1);
    const y = profileHeight - displayHeight;
    profileCtx.lineTo(x, y);
  }
  profileCtx.lineTo(profileWidth, profileHeight);
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

  // Draw some labels or scale
  profileCtx.fillStyle = 'white';
  profileCtx.font = '10px Arial';
  const topLabel = `${Math.round(maxHeight)} ft`;
  profileCtx.fillText(topLabel, 5, 12);
  profileCtx.fillText('0 ft', 5, profileHeight - 5);

  // Return as base64 data URL
  return profileCanvas.toDataURL('image/png');
}
