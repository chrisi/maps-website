import type {Point} from "@/model/base.ts";

export function drawOutlined(ctx: CanvasRenderingContext2D,
                             lineColor: string, outColor: string, lineWidth: number, outWidth: number,
                             cb: (ctx: CanvasRenderingContext2D) => void) {
  ctx.lineJoin = "round"
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

export function drawTextWithBox(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, boxColor: string, textColor: string) {
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const padding = 4;

  const rectWidth = textWidth + padding * 2;
  const rectHeight = actualHeight + padding * 2;
  const rectX = x - rectWidth / 2;
  const rectY = y - 1 - rectHeight / 2;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = boxColor;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 4);
    ctx.fill();
  } else {
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
  }
  ctx.restore();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
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
