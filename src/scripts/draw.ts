import type {Point} from "@/model/base.ts";
import {deg2rad} from "@/scripts/math.ts";

export function buildBezierPathFromPoints(points: Point[], cornerIndices: number[]): Path2D | undefined {
  if (points.length < 2) return
  const path = new Path2D()
  const pStart = points[0]!
  path.moveTo(pStart.x, pStart.y)
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = i + 2 < points.length ? points[i + 2]! : p2

    const isCorner = cornerIndices.includes(i)
    const nextIsCorner = cornerIndices.includes(i + 1)

    if (isCorner || nextIsCorner) {
      // Sharp line if either end of the segment is a corner
      path.lineTo(p2.x, p2.y)
    } else {
      // Catmull-Rom to Cubic Bezier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
  }
  return path
}

export function drawTextBoxed(ctx: CanvasRenderingContext2D, text: string, pos: Point, rotaRad: number = 0,
                              boxColor: string = 'white', textColor: string = 'black', alpha: number = 1, lineWidth: number = 1) {
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const padding = 4;

  const rectWidth = textWidth + padding * 2;
  const rectHeight = actualHeight + padding * 2;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(rotaRad);

  const rectX = -rectWidth / 2;
  const rectY = -1 - rectHeight / 2;

  ctx.setLineDash([])
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = boxColor;
  ctx.fillStyle = boxColor;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 4);
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
  } else {
    ctx.globalAlpha = alpha;
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    ctx.globalAlpha = 1;
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function drawTextOutlined(ctx: CanvasRenderingContext2D, text: string, pos: Point, rotaRad: number = 0,
                                 color: string = 'white', outColor: string = 'black', outWith: number = 2) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = outColor
  ctx.lineWidth = outWith
  ctx.fillStyle = color
  ctx.translate(pos.x, pos.y)
  ctx.rotate(rotaRad)
  ctx.strokeText(text, 0, 0)
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, pos: Point, rotaRad: number = 0, color: string = 'white') {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = color
  ctx.translate(pos.x, pos.y)
  ctx.rotate(rotaRad)
  ctx.strokeText(text, 0, 0)
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

export function drawOutlined(ctx: CanvasRenderingContext2D, cb: (ctx: CanvasRenderingContext2D) => void,
                             color: string = 'white', outColor: string = 'black', width: number = 2.5, outWidth: number = 0.5) {
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = outColor
  ctx.lineWidth = width + outWidth * 2
  cb(ctx)
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  cb(ctx)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

export function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, rotaRad: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotaRad);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size / 2);
  ctx.lineTo(-size, size / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function alphaColor(color: string, opacity: number): string {
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

export function dashStyle(width: number, style: string = 'dashed'): number[] {
  return style === 'dashed' ? [6 * width, 3 * width] : style === 'dotted' ? [width, 2.5 * width] : []
}

export function drawLine(ctx: CanvasRenderingContext2D, p1: Point, p2: Point) {
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.stroke()
}

export function drawRect(ctx: CanvasRenderingContext2D, ctr: Point, width: number, height: number, rotaDeg: number) {
  const rotation = deg2rad(rotaDeg)

  const halfW = width / 2
  const halfH = height / 2

  ctx.save()
  ctx.beginPath()

  // rotate around the center, then draw rect centered at origin
  ctx.translate(ctr.x, ctr.y)
  ctx.rotate(rotation)
  ctx.rect(-halfW, -halfH, width, height)

  ctx.restore()
  ctx.stroke()
}

export function drawCircle(ctx: CanvasRenderingContext2D, ctr: Point, rad: number) {
  ctx.beginPath()
  ctx.arc(ctr.x, ctr.y, rad, 0, 2 * Math.PI)
  ctx.stroke()
}

export function drawEllipse(ctx: CanvasRenderingContext2D, ctr: Point, majorRad: number, minorRad: number, rotaDeg: number) {
  const rotation = deg2rad(rotaDeg)

  ctx.save()
  ctx.beginPath()

  // Move origin to center, rotate axes, then scale a unit circle into an ellipse
  ctx.translate(ctr.x, ctr.y)
  ctx.rotate(rotation)
  ctx.scale(majorRad, minorRad)

  // unit circle -> scaled into ellipse
  ctx.arc(0, 0, 1, 0, 2 * Math.PI)

  ctx.restore()
  ctx.stroke()
}
