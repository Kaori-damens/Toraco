// Axe: on hit, stuns the opponent for 1 second and applies a heavy bleed.
// - On hit: defender.stun(60) (≈1s at 60fps)
// - Bleed: 1 damage every 15 frames during the stun (≈40 total if full duration).
// - Visual: uses provided Stone Axe pixel art, sword-like reach.

import { Weapon } from './base.js';
import { playSwordHitSound } from '../audio.js';

export class Axe extends Weapon {
  static color = '#8E6F3E'; // earthy brown
  static icon = 'Stone_Axe_JE2_BE2.png';

  constructor(player) {
    super(player);
    this.image.src = 'Stone_Axe_JE2_BE2.png';
    this.damage = 1;    // small immediate hit; main damage comes from bleed
    this.canHit = true; // gating like sword
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      // Heavy feel: slower spin than sword
      this.angle += 0.08 * this.spinDirection;
    }
  }

  onStunEnd() { this.canHit = true; }
  onSuccessfulHit() { this.canHit = false; }

  canAttack(isPlayerStunned) { return this.canHit && !isPlayerStunned; }

  // Attacker stunned briefly, defender gets big stun from effect anyway
  getHitStunDurations() { return { attacker: 6, defender: 0 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return true; }

  onHit(defender) {
    // Apply a modest stun (short, impactful)
    defender.stun(30); // ~0.5s

    // Toned-down bleed: shorter total duration and slower tick so it won't kill in seconds
    // Old: 600 frames @ interval 15; New: 180 frames @ interval 30 (fewer ticks, less severe)
    defender.axeBleedFrames = 180;       // total duration (~3s)
    defender.axeBleedInterval = 30;      // frames per tick (~0.5s per tick)
    defender.axeBleedCounter = 0;        // reset tick counter
    defender.bleedFlashFrames = defender.bleedFlashMax || 8; // visual feedback start
  }

  playHitSound() { playSwordHitSound(); }

  getDamageDisplayText() {
    // Attacker-side info
    return `Bleed on hit (10s)`;
  }

  getCollisionPoints() {
    const points = this._points;
    points.length = 0;

    const s = this.getScale();
    const axeReach = 110 * s;        // similar to sword, a bit shorter than spear
    const numPoints = 5;
    const collisionRadius = 12 * s;  // slightly meatier hit area
    const baseOffset = this.player.radius + 6;
    const pointSpacing = (axeReach - 20 * s) / (numPoints - 1);

    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);

    for (let i = 0; i < numPoints; i++) {
      const dist = baseOffset + (i * pointSpacing);
      points.push({
        x: this.player.x + dist * ca,
        y: this.player.y + dist * sa,
        radius: collisionRadius,
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
    const axeLength = 110 * s;
    const aspect = this.image.naturalHeight / this.image.naturalWidth;
    const axeHeight = axeLength * aspect;

    const axeX = this.player.radius;
    const axeY = -axeHeight / 2;

    const tempCanvas = this.tintCanvas;
    if (tempCanvas.width !== axeLength || tempCanvas.height !== axeHeight) {
      tempCanvas.width = axeLength;
      tempCanvas.height = axeHeight;
    }
    const tctx = tempCanvas.getContext('2d');
    tctx.clearRect(0, 0, axeLength, axeHeight);
    tctx.drawImage(this.image, 0, 0, axeLength, axeHeight);

    // subtle bronze tint
    const tint = 'rgba(142, 111, 62, 0.15)';
    tctx.globalCompositeOperation = 'multiply';
    tctx.fillStyle = tint;
    tctx.fillRect(0, 0, axeLength, axeHeight);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(this.image, 0, 0, axeLength, axeHeight);
    tctx.globalCompositeOperation = 'source-over';

    ctx.drawImage(tempCanvas, axeX, axeY, axeLength, axeHeight);
    ctx.restore();
  }
}