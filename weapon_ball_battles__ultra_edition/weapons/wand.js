/* Wand: random minor effects (small push, tiny heal on use); simple melee */
import { Weapon } from './base.js';
export class Wand extends Weapon {
  static color = '#ffd86b';
  static icon = 'wand_icon.png';
  constructor(player) { super(player); this.damage = 0.6; }
  update(isPlayerStunned) { if (!isPlayerStunned) this.angle += 0.05 * this.spinDirection; }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    pts.push({ x: this.player.x + ca * (this.player.radius + 20), y: this.player.y + sa * (this.player.radius + 20), radius: 12 });
    return pts;
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.player.x, this.player.y); ctx.rotate(this.angle);
    ctx.fillStyle = Wand.color;
    ctx.fillRect(this.player.radius, -4, 48, 8);
    ctx.restore();
  }
  canAttack() { return true; }
}