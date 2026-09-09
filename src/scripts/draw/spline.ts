import type {Point2D} from "@/model/base.ts"

export function detectCorners(points: Point2D[]): number[] {
  if (points.length < 3) return []
  const thresholdAngle = Math.PI / 4 // 45 degrees - change in direction sharper than this is a corner
  const cornerIndices = []
  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1]!
    const pCurr = points[i]!
    const pNext = points[i + 1]!

    const v1 = {x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y}
    const v2 = {x: pNext.x - pCurr.x, y: pNext.y - pCurr.y}

    const angle1 = Math.atan2(v1.y, v1.x)
    const angle2 = Math.atan2(v2.y, v2.x)

    let diff = Math.abs(angle1 - angle2)
    if (diff > Math.PI) diff = 2 * Math.PI - diff

    if (diff > thresholdAngle) {
      cornerIndices.push(i) // actual index in allPoints
    }
  }
  return cornerIndices
}

export function simplifyPoints(points: Point2D[], scale: number): Point2D[] {
  if (points.length <= 2) return points
  const tolerance = 2 / scale // Tolerance adjusted for current zoom level
  return douglasPeucker(points, tolerance)
}

export function douglasPeucker(points: Point2D[], tolerance: number): Point2D[] {
  if (points.length <= 2) return points

  let maxDistance = 0
  let index = 0
  const lastIndex = points.length - 1

  for (let i = 1; i < lastIndex; i++) {
    const distance = perpendicularDistance(points[i]!, points[0]!, points[lastIndex]!)
    if (distance > maxDistance) {
      maxDistance = distance
      index = i
    }
  }

  if (maxDistance > tolerance) {
    const res1 = douglasPeucker(points.slice(0, index + 1), tolerance)
    const res2 = douglasPeucker(points.slice(index), tolerance)
    return [...res1.slice(0, res1.length - 1), ...res2]
  } else {
    return [points[0]!, points[lastIndex]!]
  }
}

export function addSplineToPath(path: Path2D, points: Point2D[]): void {
  if (points.length < 2) return

  const isClosed = points.length > 2 &&
    Math.abs(points[0]!.x - points[points.length - 1]!.x) < 1e-5 &&
    Math.abs(points[0]!.y - points[points.length - 1]!.y) < 1e-5

  path.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? (isClosed ? points[points.length - 2]! : points[0]!) : points[i - 1]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = i + 2 < points.length ? points[i + 2]! : (isClosed ? points[1]! : p2)

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }
}

function perpendicularDistance(pt: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  if (dx === 0 && dy === 0) {
    return Math.sqrt(Math.pow(pt.x - lineStart.x, 2) + Math.pow(pt.y - lineStart.y, 2))
  }

  const t = ((pt.x - lineStart.x) * dx + (pt.y - lineStart.y) * dy) / (dx * dx + dy * dy)
  const nearestX = lineStart.x + t * dx
  const nearestY = lineStart.y + t * dy

  return Math.sqrt(Math.pow(pt.x - nearestX, 2) + Math.pow(pt.y - nearestY, 2))
}
