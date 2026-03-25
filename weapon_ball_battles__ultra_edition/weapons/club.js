// Club: short, heavy melee weapon that stuns briefly on hit
import { Weapon } from './base.js';
import { playSwordHitSound } from '../audio.js';

export class Club extends Weapon {
  static color = '#a97442';
  static icon = 'Stone_Axe_JE2_BE2.png'; // reuse stone axe sprite as a club

  constructor(player) {
    super(player);
    this.damage = 1.6;
    this.swingSpeed = 0.07;
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      this.angle += this.swingSpeed * this.spinDirection;
    }
  }

  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;

    const s = this.getScale();
    const length = 80 * s;
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);

    // sample a few points along the club
    const samples = 4;
    const base = this.player.radius + 6;
    const step = (length - 16 * s) / (samples - 1);
    const r = 13 * s;

    for (let i = 0; i < samples; i++) {
      const d = base + i * step;
      pts.push({
        x: this.player.x + ca * d,
        y: this.player.y + sa * d,
        radius: r
      });
    }

    return pts;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);

    const s = this.getScale();
    const length = 80 * s;
    const thickness = 18 * s;

    ctx.fillStyle = Club.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    ctx.fillRect(this.player.radius, -thickness / 2, length, thickness);
    ctx.strokeRect(this.player.radius, -thickness / 2, length, thickness);

    ctx.restore();
  }

  playHitSound() { playSwordHitSound(); }
  canAttack() { return true; }

  getHitStunDurations() {
    return { attacker: 4, defender: 10 };
  }

  getDamageDisplayText() {
    return `Club • Dmg: ${this.damage.toFixed(1)}`;
  }
}