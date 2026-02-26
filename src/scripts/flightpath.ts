import {createCanvas, loadImage} from 'canvas';

/**
 * Creates a height profile image along a given path and returns it as a base64 data URL.
 *
 * @param heightMaskPath Path to the heightmask image (e.g., 'public/heightmasks/balkans.png')
 * @param start { x: number, y: number } Start coordinate on the map
 * @param end { x: number, y: number } End coordinate on the map
 * @returns A PNG data URL string (e.g., "data:image/png;base64,.....")
 */
export async function createProfileAlongPath(
  heightMaskPath: string,
  start: { x: number, y: number },
  end: { x: number, y: number }
) {
  const image = await loadImage(heightMaskPath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(distance);

  const profileWidth = steps;
  const profileHeight = 400; // Fixed height for the profile image
  const profileCanvas = createCanvas(profileWidth, profileHeight);
  const profileCtx = profileCanvas.getContext('2d');

  // Background
  profileCtx.fillStyle = 'lightblue';
  profileCtx.fillRect(0, 0, profileWidth, profileHeight);

  profileCtx.strokeStyle = 'green';
  profileCtx.beginPath();

  const heights: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = Math.floor(start.x + dx * t);
    const py = Math.floor(start.y + dy * t);

    if (px >= 0 && px < image.width && py >= 0 && py < image.height) {
      const index = (py * image.width + px) * 4;
      const r = data[index]!;
      const g = data[index + 1]!;
      const b = data[index + 2];

      // If R==G==B, it's likely grayscale 0-255 mapped to some range.
      // If it's a BMS heightmask, it's often encoded as (R + G * 256) in feet.
      // Let's check if it's grayscale.
      let heightInFeet: number;
      if (r === g && g === b) {
        // Grayscale: each unit equals 100 ft
        heightInFeet = r * 100;
      } else {
        // Encoded: (R + G * 256) units, each unit equals 100 ft
        heightInFeet = (r + g * 256) * 100;
      }
      heights.push(heightInFeet);
    }
  }

  // Determine max height for scaling
  //const maxHeight = heights.length > 0 ? Math.max(...heights) : 10000;
  const maxHeight = 30000;

  // Draw the profile line
  for (let i = 0; i < heights.length; i++) {
    const heightInFeet = heights[i]!;
    const displayHeight = maxHeight > 0 ? (heightInFeet / maxHeight) * (profileHeight - 1) : 0;
    const y = profileHeight - displayHeight;

    if (i === 0) {
      profileCtx.moveTo(i, y);
    } else {
      profileCtx.lineTo(i, y);
    }
  }
  profileCtx.stroke();

  // Fill under the curve
  profileCtx.lineTo(heights.length - 1, profileHeight);
  profileCtx.lineTo(0, profileHeight);
  profileCtx.fillStyle = 'rgba(0, 255, 0, 0.2)';
  profileCtx.fill();

  // Draw some labels or scale
  profileCtx.fillStyle = 'white';
  profileCtx.font = '12px Arial';
  const topLabel = `${Math.round(maxHeight)} ft`;
  profileCtx.fillText(topLabel, 5, 15);
  profileCtx.fillText('0 ft', 5, profileHeight - 5);

  // Return as base64 data URL
  return profileCanvas.toDataURL('image/png');
}
