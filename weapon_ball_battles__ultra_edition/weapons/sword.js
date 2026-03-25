// Sword implementation (base spinning blade with tint-on-hit)
import { Weapon } from './base.js';
import { playSwordHitSound } from '../audio.js';

export class Sword extends Weapon {
  static color = '#f45c64';
  // Use the dedicated pixel sword sprite as the UI icon
  static icon = 'pixil-frame-0%20(4).png';

  constructor(player) {
    super(player);
    this.image.src = 'pixil-frame-0%20(2).png';
    this.damage = 1;
    this.canHit = true; // cooldown after hitting
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      this.angle += 0.1 * this.spinDirection;
    }
  }

  onStunEnd() { this.canHit = true; }
  onSuccessfulHit() { this.canHit = false; }

  canAttack(isPlayerStunned) { return this.canHit && !isPlayerStunned; }

  getHitStunDurations() { return { attacker: 8, defender: 8 }; }
  grantsImmunityOnHit() { return true; }
  shouldReverseOnHit() { return true; }

  onHit(defender) {
    const hitCount = this.damage;
    const alpha = Math.min(1, hitCount * 0.1);
    this.tintColor = `rgba(255, 0, 0, ${alpha})`;
    this.damage += 1;
  }

  playHitSound() { playSwordHitSound(); }
  getDamageDisplayText() { return `Damage: ${this.damage}`; }

  getCollisionPoints() {
    const points = this._points;
    points.length = 0;

    const s = this.getScale();
    const swordLength = 120 * s;
    const numPoints = 5;
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
    const swordSize = 120 * s;
    const aspectRatio = this.image.naturalHeight / this.image.naturalWidth;
    const swordHeight = swordSize * aspectRatio;
    const swordX = this.player.radius;
    const swordY = -swordHeight / 2;

    const tempCanvas = this.tintCanvas;
    if (tempCanvas.width !== swordSize || tempCanvas.height !== swordHeight) {
      tempCanvas.width = swordSize;
      tempCanvas.height = swordHeight;
    }
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.clearRect(0, 0, swordSize, swordHeight);
    tempCtx.drawImage(this.image, 0, 0, swordSize, swordHeight);

    if (this.tintColor !== 'rgba(255, 0, 0, 0)') {
      tempCtx.globalCompositeOperation = 'multiply';
      tempCtx.fillStyle = this.tintColor;
      tempCtx.fillRect(0, 0, swordSize, swordHeight);
      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.drawImage(this.image, 0, 0, swordSize, swordHeight);
      tempCtx.globalCompositeOperation = 'source-over';
    }

    ctx.drawImage(tempCanvas, swordX, swordY, swordSize, swordHeight);
    ctx.restore();
  }
}