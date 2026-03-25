/* Mop: comical low-damage wide-area smear that slows on hit (visual only) */
import { Weapon } from './base.js';
export class Mop extends Weapon {
  static color = '#ffdede';
  static icon = 'mop_icon.png';
  constructor(player) {
    super(player);
    this.damage = 0.4;
  }
  update(isPlayerStunned) { if (!isPlayerStunned) this.angle += 0.03 * this.spinDirection; }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale();
    for (let i = 0; i < 6; i++) {
      const d = this.player.radius + 12 + i * 12 * s;
      const ca = Math.cos(this.angle + (i - 3)*0.08);
      const sa = Math.sin(this.angle + (i - 3)*0.08);
      pts.push({ x: this.player.x + ca * d, y: this.player.y + sa * d, radius: 16 * s });
    }
    return pts;
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.player.x, this.player.y); ctx.rotate(this.angle);
    const s = this.getScale();
    ctx.fillStyle = Mop.color;
    ctx.fillRect(this.player.radius, -18 * s, 90 * s, 36 * s);
    ctx.restore();
  }
  canAttack() { return true; }
}