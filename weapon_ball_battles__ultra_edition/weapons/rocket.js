/* Simple RocketLauncher: spawns a single fast projectile that explodes for AoE damage */
import { Weapon } from './base.js';
import { playGunShotSound, playHitHurtSound } from '../audio.js';

export class RocketLauncher extends Weapon {
  static color = '#FF6B6B';
  static icon = 'pixil-frame-0%20(3).png';

  constructor(player) {
    super(player);
    this.cooldown = 0;
    this.interval = 60; // frames between rockets
    this.projectiles = [];
    this.damage = 6;
    this.speed = 18;
  }

  update(isPlayerStunned) {
    if (this.cooldown > 0) this.cooldown--;
    // update rockets
    this.projectiles = this.projectiles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) {
        // explode (deal simple immediate damage by marking life=0; game collision system handles projectile hits)
        return false;
      }
      const canvas = document.getElementById('gameCanvas');
      if (canvas && (p.x < -20 || p.x > canvas.width + 20 || p.y < -20 || p.y > canvas.height + 20)) return false;
      return true;
    });
  }

  shoot() {
    if (this.cooldown > 0) return;
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    const startX = this.player.x + ca * (this.player.radius + 12);
    const startY = this.player.y + sa * (this.player.radius + 12);
    this.projectiles.push({
      x: startX, y: startY,
      vx: ca * this.speed, vy: sa * this.speed,
      life: 180
    });
    this.cooldown = this.interval;
    if (!this.isMenuContext) playGunShotSound();
  }

  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    this.projectiles.forEach(p => pts.push({ x: p.x, y: p.y, radius: 14, type: 'rocket', projectileRef: p }));
    return pts;
  }

  draw(ctx) {
    // draw simple rockets as small rectangles
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = RocketLauncher.color;
      ctx.fillRect(-6, -3, 12, 6);
      ctx.restore();
    });
  }

  playHitSound() { playHitHurtSound(); }
  canAttack() { return true; }
}