import {describe, expect, it} from "vitest";
import {drawProfileAlongPath, type ProfileWaypoint} from "./flightpath";

function createMockCanvas(width = 400, height = 300) {
  const strokeCalls: string[] = [];
  const moveToCalls: {x: number, y: number}[] = [];
  const lineToCalls: {x: number, y: number}[] = [];
  let currentStrokeStyle = "";

  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "",
    textBaseline: "",
    beginPath: () => {},
    closePath: () => {},
    stroke: () => {
      strokeCalls.push(ctx.strokeStyle);
    },
    fill: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    moveTo: (x: number, y: number) => {
      moveToCalls.push({x, y});
    },
    lineTo: (x: number, y: number) => {
      lineToCalls.push({x, y});
    },
    setLineDash: () => {},
    drawImage: () => {},
    getImageData: (x: number, y: number, w: number, h: number) => {
      return {
        data: new Uint8ClampedArray(w * h * 4)
      };
    }
  };

  const canvas = {
    width,
    height,
    getContext: (type: string) => {
      if (type === "2d") return ctx;
      return null;
    }
  };

  return {canvas: canvas as unknown as HTMLCanvasElement, ctx, strokeCalls, moveToCalls, lineToCalls};
}

describe("flightpath", () => {
  it("throws an error when fewer than 2 waypoints are provided", async () => {
    const {canvas} = createMockCanvas();
    await expect(drawProfileAlongPath(canvas, "dummy.png", [{x: 0, y: 0, z: 1000}])).rejects.toThrow(
      "At least two waypoints are required to create a profile."
    );
  });

  it("draws profile and white waypoint flight line on canvas context", async () => {
    const {canvas, strokeCalls, moveToCalls, lineToCalls} = createMockCanvas(400, 300);

    const originalDocument = (globalThis as any).document;
    const originalImage = (globalThis as any).Image;

    (globalThis as any).document = {
      createElement(tag: string) {
        if (tag === "canvas") {
          return createMockCanvas(100, 100).canvas;
        }
        return {};
      }
    };

    (globalThis as any).Image = class {
      src = "";
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    };

    const waypoints: ProfileWaypoint[] = [
      {x: 0, y: 0, z: 10000},
      {x: 50, y: 50, z: 20000},
      {x: 100, y: 100, z: 30000}
    ];

    try {
      await drawProfileAlongPath(canvas, "test.png", waypoints);
      expect(strokeCalls).toContain("white");
      // Verify line segments for waypoints
      expect(moveToCalls.length).toBeGreaterThan(0);
      expect(lineToCalls.length).toBeGreaterThan(0);
    } finally {
      (globalThis as any).document = originalDocument;
      (globalThis as any).Image = originalImage;
    }
  });
});
