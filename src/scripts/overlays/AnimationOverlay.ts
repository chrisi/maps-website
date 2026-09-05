import {BaseOverlay} from "@/scripts/overlays/BaseOverlay.ts";
import type {Canvas} from "@/scripts/overlays/Canvas.ts";
import type {Point2D} from "@/model/base.ts";

export class AnimationOverlay extends BaseOverlay {

  private pos: Point2D = {x: 2048, y: 2048};
  private orbitRadius: number = 80;
  private orbitAngle: number = 0;
  private rectAngle: number = 0;
  private orbitSpeed: number = 0.8; // radians per second
  private rotationSpeed: number = 2.0; // radians per second

  private rectWidth: number = 32;
  private rectHeight: number = 20;

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;

  constructor(pos?: Point2D, orbitRadius: number = 80) {
    super();
    if (pos) {
      this.pos = pos;
    }
    this.orbitRadius = orbitRadius;
  }

  public init(): void {
    if (this.global.map) {
      // Default center to middle of the map if not explicitly set
      if (this.pos.x === 2048 && this.pos.y === 2048 && this.global.map.pixels) {
        this.pos = {
          x: this.global.map.pixels / 2,
          y: this.global.map.pixels / 2
        };
      }
    }
    this.startAnimation();
  }

  public stepAnimation(dt: number): void {
    this.orbitAngle = (this.orbitAngle + this.orbitSpeed * dt) % (2 * Math.PI);
    this.rectAngle = (this.rectAngle + this.rotationSpeed * dt) % (2 * Math.PI);
  }

  public startAnimation(): void {
    if (this.animationFrameId !== null) return;
    if (typeof requestAnimationFrame !== 'function') return;

    this.lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      if (this.isEnabled()) {
        this.stepAnimation(dt);
        this.redraw();
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stopAnimation(): void {
    if (this.animationFrameId !== null) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = null;
    }
  }

  public onDraw(cnv: Canvas): void {
    if (!this.pos) return;

    const ctx = cnv.context;
    const center = this.toCnv(this.pos, cnv);
    const scaledRadius = this.orbitRadius * cnv.scale;

    ctx.save();

    // 1. Draw orbit circle path
    ctx.beginPath();
    ctx.arc(center.x, center.y, scaledRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw central circle core
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#00d2ff';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 3. Compute orbit position
    const orbitX = center.x + Math.cos(this.orbitAngle) * scaledRadius;
    const orbitY = center.y + Math.sin(this.orbitAngle) * scaledRadius;

    // 4. Draw rotating rectangle
    ctx.save();
    ctx.translate(orbitX, orbitY);
    ctx.rotate(this.rectAngle);

    const halfW = this.rectWidth / 2;
    const halfH = this.rectHeight / 2;
    const r = 4; // corner radius

    const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    grad.addColorStop(0, '#00d2ff');
    grad.addColorStop(1, '#0072ff');

    // Rounded rectangle path
    ctx.beginPath();
    ctx.moveTo(-halfW + r, -halfH);
    ctx.lineTo(halfW - r, -halfH);
    ctx.arcTo(halfW, -halfH, halfW, -halfH + r, r);
    ctx.lineTo(halfW, halfH - r);
    ctx.arcTo(halfW, halfH, halfW - r, halfH, r);
    ctx.lineTo(-halfW + r, halfH);
    ctx.arcTo(-halfW, halfH, -halfW, halfH - r, r);
    ctx.lineTo(-halfW, -halfH + r);
    ctx.arcTo(-halfW, -halfH, -halfW + r, -halfH, r);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Center indicator dot
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}
