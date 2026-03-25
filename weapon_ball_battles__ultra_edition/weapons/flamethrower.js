/* Flamethrower: emits short-lived flame projectiles in a cone that tick damage */
import { Weapon } from './base.js';
import { playHitHurtSound } from '../audio.js';

export class Flamethrower extends Weapon {
  static color = '#FF8C00';
  static icon = 'pixil-frame-0%20(4).png';

  constructor(player) {
    super(player);
    this.damage = 0.5;
    this.particles = [];
    this.emitRate = 6;
    this.emitTimer = 0;
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      this.emitTimer--;
      if (this.emitTimer <= 0) {
        this.emitTimer = this.emitRate;
        this.emitParticle();
      }
    }

    this.particles = this.particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      return p.life > 0;
    });
  }

  emitParticle() {
    const spread = 0.6;
    const a = this.angle + (Math.random() - 0.5) * spread;
    const speed = 6 + Math.random() * 3;
    this.particles.push({
      x: this.player.x + Math.cos(a) * (this.player.radius + 8),
      y: this.player.y + Math.sin(a) * (this.player.radius + 8),
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      life: 30
    });
  }

  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    this.particles.forEach(p => pts.push({ x: p.x, y: p.y, radius: 10, type: 'flame', projectileRef: p }));
    return pts;
  }

  draw(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,140,0,0.9)';
      ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
  }

  playHitSound() { playHitHurtSound(); }
  canAttack() { return true; }
}