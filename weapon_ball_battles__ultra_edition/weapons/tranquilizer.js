/* Tranquilizer: shoots small darts that briefly stun on hit */
import { Weapon } from './base.js';
import { playHitHurtSound } from '../audio.js';

export class Tranquilizer extends Weapon {
  static color = '#9EA8FF';
  static icon = 'test_ball_icon.png';
  constructor(player) {
    super(player);
    this.projectiles = [];
    this.cooldown = 0;
    this.interval = 40;
    this.speed = 12;
    this.damage = 0.2;
  }
  update(isPlayerStunned) {
    if (!isPlayerStunned && this.cooldown <= 0) {
      this.shoot();
    }
    if (this.cooldown > 0) this.cooldown--;
    this.projectiles = this.projectiles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) return false;
      const c = document.getElementById('gameCanvas');
      if (c && (p.x < -20 || p.x > c.width + 20 || p.y < -20 || p.y > c.height + 20)) return false;
      return true;
    });
  }
  shoot() {
    if (this.cooldown > 0) return;
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    const startX = this.player.x + ca * (this.player.radius + 8);
    const startY = this.player.y + sa * (this.player.radius + 8);
    this.projectiles.push({ x: startX, y: startY, vx: ca * this.speed, vy: sa * this.speed, life: 160, kind: 'tranq', projectileRef: null });
    this.cooldown = this.interval;
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    this.projectiles.forEach(p => pts.push({ x: p.x, y: p.y, radius: 8, type: 'tranq', projectileRef: p }));
    return pts;
  }
  draw(ctx) {
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.fillStyle = Tranquilizer.color;
      ctx.fillRect(p.x - 4, p.y - 2, 8, 4);
      ctx.restore();
    });
  }
  playHitSound() { playHitHurtSound(); }
  canAttack() { return true; }
}