/* Water Gun: short-range cone that pushes and slightly cools enemies (no status for now) */
import { Weapon } from './base.js';
import { playHitHurtSound } from '../audio.js';

export class WaterGun extends Weapon {
  static color = '#66ccff';
  static icon = 'bow_icon.png';
  constructor(player) {
    super(player);
    this.damage = 0.2;
    this.interval = 6;
    this.timer = 0;
  }
  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      this.angle += 0.03 * this.spinDirection;
      if (this.timer > 0) this.timer--;
      if (this.timer <= 0) {
        this.timer = this.interval;
        // treat water beam as continuous melee; no separate projectiles
      }
    }
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale();
    const samples = 6;
    for (let i = 0; i < samples; i++) {
      const d = this.player.radius + 20 + i * 18 * s;
      const ca = Math.cos(this.angle + (i - (samples/2))*0.06);
      const sa = Math.sin(this.angle + (i - (samples/2))*0.06);
      pts.push({ x: this.player.x + ca * d, y: this.player.y + sa * d, radius: 12 * s, type: 'waterbeam' });
    }
    return pts;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);
    const s = this.getScale();
    ctx.fillStyle = WaterGun.color;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(this.player.radius, -8 * s, 80 * s, 16 * s);
    ctx.restore();
  }
  playHitSound() { playHitHurtSound(); }
  canAttack() { return true; }
}