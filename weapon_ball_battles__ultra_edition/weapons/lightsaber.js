/* Lightsaber: instant reach energy blade (visual only, melee) */
import { Weapon } from './base.js';
import { playSwordHitSound } from '../audio.js';

export class Lightsaber extends Weapon {
  static color = '#80ffd4';
  static icon = 'pixil-frame-0.png';
  constructor(player) {
    super(player);
    this.damage = 2.2;
  }
  update(isPlayerStunned) {
    if (!isPlayerStunned) this.angle += 0.06 * this.spinDirection;
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale();
    const len = 140 * s;
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    // Dense sampling for a continuous beam
    for (let i = 0; i < 8; i++) {
      const d = this.player.radius + 8 + (i / 7) * (len - 16);
      pts.push({ x: this.player.x + ca * d, y: this.player.y + sa * d, radius: 14 * s });
    }
    return pts;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);
    const s = this.getScale();
    const len = 140 * s;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = Lightsaber.color;
    ctx.fillRect(this.player.radius, -6 * s, len, 12 * s);
    ctx.restore();
  }
  playHitSound() { playSwordHitSound(); }
  canAttack() { return true; }
}