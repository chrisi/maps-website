import type {Point} from "@/model/base.ts";
import {drawCircle, drawPolygon, drawRect} from "@/scripts/draw/basic.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import {deg2rad} from "@/scripts/math.ts";

export function drawNavVor(ctx: CanvasRenderingContext2D, pt: Point, scale: number) {
  const lineWidth = 0.8 * scale
  const hexRad = 7 * scale
  const circleRad = hexRad * 0.2
  drawPolygon(ctx, pt, 6, hexRad, 0, {fillStyle: 'white', strokeStyle: 'black', lineWidth: lineWidth})
  drawCircle(ctx, pt, circleRad, {fillStyle: 'black', strokeStyle: 'black', lineWidth: lineWidth})
}

export function drawNavDme(ctx: CanvasRenderingContext2D, pt: Point, scale: number) {
  const lineWidth = 0.8 * scale
  const hexRad = 7 * scale
  const circleRad = hexRad * 0.2
  drawRect(ctx, pt, hexRad * 2.2, hexRad * 2 * Math.sin(1.0472), 0, {fillStyle: 'white', strokeStyle: 'black', lineWidth: lineWidth})
  drawCircle(ctx, pt, circleRad, {fillStyle: 'black', strokeStyle: 'black', lineWidth: lineWidth})
}

export function drawNavVorDme(ctx: CanvasRenderingContext2D, pt: Point, scale: number) {
  const lineWidth = 0.8 * scale
  const hexRad = 7 * scale
  const circleRad = hexRad * 0.2
  drawRect(ctx, pt, hexRad * 2.2, hexRad * 2 * Math.sin(1.0472), 0, {fillStyle: 'white', strokeStyle: 'black', lineWidth: lineWidth})
  drawPolygon(ctx, pt, 6, hexRad, 0, {strokeStyle: 'black', lineWidth: lineWidth})
  drawCircle(ctx, pt, circleRad, {fillStyle: 'black', strokeStyle: 'black', lineWidth: lineWidth})
}

export function drawNavTacan(ctx: CanvasRenderingContext2D, pt: Point, scale: number, vortac: boolean = false) {
  const lineWidth = 0.8 * scale
  const hexRad = 7 * scale
  const circleRad = hexRad * 0.2
  const apothem = hexRad * Math.sqrt(3) / 2 // Distance from center to side midpoint
  const tabLen = hexRad * 0.6
  const tabWidth = 1.8
  const tabAngles = [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6]; // 90, 210, 330 degrees
  ctx.save()
  ctx.translate(pt.x, pt.y)
  ctx.lineWidth = lineWidth
  let start = true
  tabAngles.forEach(function (angle) {
    ctx.save()
    ctx.rotate(angle)
    if (start) {
      ctx.beginPath()
      ctx.moveTo(apothem, -hexRad / tabWidth)
      start = false
    } else {
      ctx.lineTo(apothem, -hexRad / tabWidth)
    }
    ctx.lineTo(apothem, -hexRad / tabWidth)
    ctx.lineTo(apothem + tabLen, -hexRad / tabWidth)
    ctx.lineTo(apothem + tabLen, hexRad / tabWidth)
    ctx.lineTo(apothem, hexRad / tabWidth)
    ctx.restore()
  })
  ctx.closePath()
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.strokeStyle = 'black'
  ctx.stroke()
  if (vortac) {
    ctx.fillStyle = 'black'
    tabAngles.forEach(function (angle) {
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(apothem, -hexRad / 1.8);
      ctx.lineTo(apothem + tabLen, -hexRad / 1.8);
      ctx.lineTo(apothem + tabLen, hexRad / 1.8);
      ctx.lineTo(apothem, hexRad / 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    })
  }
  ctx.restore()
  drawCircle(ctx, pt, circleRad, {fillStyle: 'black', strokeStyle: 'black', lineWidth: lineWidth})
}

export function drawAirbase(ctx: CanvasRenderingContext2D, pt: Point, orientation: number, scale: number = 1.0, dualRw: boolean = false, strip: boolean = false) {

  const oriRad = deg2rad(orientation + 90)

  const length = 32 * scale
  const rad = (dualRw ? 9 : 7) * scale
  const inWidth = 3 * scale
  const outWidth = 5 * scale
  const cbWidth = 1.2 * scale
  const gap = 5 * scale

  const dxo = Math.cos(oriRad) * (length / 2)
  const dyo = Math.sin(oriRad) * (length / 2)

  const dxi = Math.cos(oriRad) * ((length - 2) / 2)
  const dyi = Math.sin(oriRad) * ((length - 2) / 2)

  let offsets = [{x: 0, y: 0}];

  if (dualRw) {
    const ox = Math.cos(oriRad + Math.PI / 2) * (gap / 2);
    const oy = Math.sin(oriRad + Math.PI / 2) * (gap / 2);
    offsets = [
      {x: ox, y: oy},
      {x: -ox, y: -oy}
    ];
  }

  if (!strip)
    drawCircle(ctx, pt, rad, {strokeStyle: 'navy', fillStyle: 'navy', lineWidth: cbWidth})

  ctx.beginPath();
  offsets.forEach(function (o) {
    ctx.moveTo(pt.x + o.x - dxo, pt.y + o.y - dyo);
    ctx.lineTo(pt.x + o.x + dxo, pt.y + o.y + dyo);
  });
  ctx.lineWidth = outWidth;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  ctx.beginPath();
  offsets.forEach(function (o) {
    ctx.moveTo(pt.x + o.x - dxi, pt.y + o.y - dyi);
    ctx.lineTo(pt.x + o.x + dxi, pt.y + o.y + dyi);
  });
  ctx.lineWidth = inWidth;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}
