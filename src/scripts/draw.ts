import type {Point} from "@/model/base.ts";

export function drawSmoothLine(ctx: CanvasRenderingContext2D,
                               points: Point[],
                               cornerIndices: number[],
                               lineColor: string,
                               lineWidth: number,
                               toCnv: (p: Point) => Point) {
  if (points.length < 2) return;
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = lineColor
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  const allPts = points.map(p => toCnv(p));
  const pStart = allPts[0]!;
  ctx.moveTo(pStart.x, pStart.y);
  for (let i = 0; i < allPts.length - 1; i++) {
    const p0 = allPts[i === 0 ? i : i - 1]!;
    const p1 = allPts[i]!;
    const p2 = allPts[i + 1]!;
    const p3 = i + 2 < allPts.length ? allPts[i + 2]! : p2;

    const isCorner = cornerIndices.includes(i);
    const nextIsCorner = cornerIndices.includes(i + 1);

    if (isCorner || nextIsCorner) {
      // Sharp line if either end of the segment is a corner
      ctx.lineTo(p2.x, p2.y);
    } else {
      // Catmull-Rom to Cubic Bezier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }
  ctx.stroke()
}

export function drawOutlined(ctx: CanvasRenderingContext2D,
                             lineColor: string, outColor: string, lineWidth: number, outWidth: number,
                             cb: (ctx: CanvasRenderingContext2D) => void) {
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.strokeStyle = outColor
  ctx.lineWidth = lineWidth + outWidth * 2
  cb(ctx)
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.strokeStyle = lineColor
  ctx.lineWidth = lineWidth
  cb(ctx)
  ctx.closePath()
  ctx.stroke()
}

export function drawTextWithBox(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, boxColor: string, textColor: string, rotation: number = 0, dy: number = 0) {
  ctx.save();
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const padding = 4;

  const rectWidth = textWidth + padding * 2;
  const rectHeight = actualHeight + padding * 2;

  ctx.translate(x, y);
  ctx.rotate(rotation);

  const rectX = -rectWidth / 2;
  const rectY = -1 - rectHeight / 2 + dy;

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = boxColor;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 4);
    ctx.fill();
  } else {
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
  }

  ctx.globalAlpha = 1.0;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, dy);
  ctx.restore();
}

export function drawTextOutlined(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string = 'white') {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeText(text, x, y);

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size / 2);
  ctx.lineTo(-size, size / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function colorWithAlpha(color: string, opacity: number): string {
  const a = Math.min(1, Math.max(0, opacity / 100))

  // Support #RGB and #RRGGBB. If it's not hex, just return the color unchanged.
  const hex = color.trim()
  if (!hex.startsWith('#')) return color

  const raw = hex.slice(1)
  const full = raw.length === 3
    ? raw.split('').map(ch => ch + ch).join('')
    : raw.length === 6
      ? raw
      : null

  if (!full) return color

  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${a})`
}
