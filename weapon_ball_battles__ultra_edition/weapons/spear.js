// Spear implementation (grows damage and length on hits)
import { Sword } from './sword.js';
import { playSpearHitSound } from '../audio.js';

export class Spear extends Sword {
  static color = '#1bfff5';
  static icon = 'spear_icon.png';

  constructor(player) {
    super(player);
    this.image.src = 'spear.png';
    this.spearLength = 1;
  }

  onHit(defender) {
    this.damage += 0.2;
    this.spearLength += 0.1;
    const hitCount = (this.damage - 1) / 0.2;
    const alpha = Math.min(1, hitCount * 0.08);
    this.tintColor = `rgba(0, 255, 255, ${alpha})`;
  }

  playHitSound() { playSpearHitSound(); }

  getDamageDisplayText() {
    const displayValue = Number.isInteger(this.damage) ? this.damage : this.damage.toFixed(1);
    return `Damage/Range: ${displayValue}`;
  }

  getCollisionPoints() {
    const points = this._points;
    points.length = 0;

    const s = this.getScale();
    const swordLength = 120 * this.spearLength * s;
    const numPoints = Math.max(4, Math.floor(this.spearLength * 6));
    const collisionRadius = 10 * s;
    const baseOffset = this.player.radius + 5;
    const pointSpacing = (swordLength - 20 * s) / (numPoints - 1);

    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);

    for (let i = 0; i < numPoints; i++) {
      const dist = baseOffset + (i * pointSpacing);
      points.push({
        x: this.player.x + dist * ca,
        y: this.player.y + dist * sa,
        radius: collisionRadius
      });
    }
    return points;
  }

  draw(ctx) {
    if (!this.image.complete || this.image.naturalWidth === 0) return;

    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);

    const s = this.getScale();
    const baseLength = 120 * s;
    const stretchedLength = baseLength * this.spearLength;
    const aspectRatio = this.image.naturalHeight / this.image.naturalWidth;
    const thickness = baseLength * aspectRatio;

    const spearX = this.player.radius;
    const spearY = -thickness / 2;

    const tempCanvas = this.tintCanvas;
    if (tempCanvas.width !== stretchedLength || tempCanvas.height !== thickness) {
      tempCanvas.width = stretchedLength;
      tempCanvas.height = thickness;
    }
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.clearRect(0, 0, stretchedLength, thickness);
    tempCtx.drawImage(this.image, 0, 0, stretchedLength, thickness);

    if (this.tintColor !== 'rgba(255, 0, 0, 0)') {
      tempCtx.globalCompositeOperation = 'multiply';
      tempCtx.fillStyle = this.tintColor;
      tempCtx.fillRect(0, 0, stretchedLength, thickness);
      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.drawImage(this.image, 0, 0, stretchedLength, thickness);
      tempCtx.globalCompositeOperation = 'source-over';
    }

    ctx.drawImage(tempCanvas, spearX, spearY, stretchedLength, thickness);
    ctx.restore();
  }
}

