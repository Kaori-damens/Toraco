/* Hammer: heavy blunt weapon that stuns on hit */
import { Weapon } from './base.js';
import { playSwordHitSound } from '../audio.js';

export class Hammer extends Weapon {
  static color = '#DCA55A';
  static icon = 'Stone_Axe_JE2_BE2.png';

  constructor(player) {
    super(player);
    this.damage = 2.2;
    this.swingSpeed = 0.06;
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      this.angle += this.swingSpeed * this.spinDirection;
    }
  }

  onHit(defender) {
    if (defender && typeof defender.stun === 'function') defender.stun(40);
  }

  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale();
    const len = 90 * s;
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    pts.push({ x: this.player.x + ca * (this.player.radius + len), y: this.player.y + sa * (this.player.radius + len), radius: 16 * s });
    return pts;
  }

  draw(ctx) {
    ctx.save(); ctx.translate(this.player.x, this.player.y); ctx.rotate(this.angle);
    const s = this.getScale();
    ctx.fillStyle = Hammer.color;
    ctx.fillRect(this.player.radius, -8*s, 64*s, 16*s);
    ctx.restore();
  }

  playHitSound() { playSwordHitSound(); }
  canAttack() { return true; }
}