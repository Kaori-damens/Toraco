/* Bat: melee blunt short-range */
import { Weapon } from './base.js';
import { playSwordHitSound } from '../audio.js';

export class Bat extends Weapon {
  static color = '#b5651d';
  static icon = 'Stone_Axe_JE2_BE2.png';
  constructor(player) {
    super(player);
    this.damage = 1.4;
  }
  update(isPlayerStunned) { if (!isPlayerStunned) this.angle += 0.06 * this.spinDirection; }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale();
    const len = 90 * s;
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    for (let i = 0; i < 4; i++) {
      const d = this.player.radius + 10 + i * (len / 4);
      pts.push({ x: this.player.x + ca * d, y: this.player.y + sa * d, radius: 12 * s });
    }
    return pts;
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.player.x, this.player.y); ctx.rotate(this.angle);
    const s = this.getScale();
    ctx.fillStyle = Bat.color;
    ctx.fillRect(this.player.radius, -8*s, 60*s, 16*s);
    ctx.restore();
  }
  playHitSound() { playSwordHitSound(); }
  canAttack() { return true; }
}