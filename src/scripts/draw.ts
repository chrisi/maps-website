export function drawOutlined(ctx: CanvasRenderingContext2D,
                             lineColor: string, outColor: string, lineWidth: number, outWidth: number,
                             cb: (ctx: CanvasRenderingContext2D) => void) {
  ctx.beginPath()
  ctx.strokeStyle = outColor
  ctx.lineWidth = lineWidth + outWidth * 2
  cb(ctx)
  ctx.stroke()
  ctx.beginPath()
  ctx.strokeStyle = lineColor
  ctx.lineWidth = lineWidth
  cb(ctx)
  ctx.stroke()
}
