/* Lava Gun: short bursts of hot projectiles that deal burn (simple damage) */
import { Weapon } from './base.js';
import { playHitHurtSound } from '../audio.js';

export class LavaGun extends Weapon {
  static color = '#ff6b1b';
  static icon = 'pixil-frame-0%20(4).png';
  constructor(player) {
    super(player);
    this.projectiles = [];
    this.cooldown = 0;
    this.interval = 28;
    this.speed = 9;
    this.damage = 1.2;
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
    const startX = this.player.x + ca * (this.player.radius + 10);
    const startY = this.player.y + sa * (this.player.radius + 10);
    this.projectiles.push({ x: startX, y: startY, vx: ca * this.speed, vy: sa * this.speed, life: 140, kind: 'flame', projectileRef: null });
    this.cooldown = this.interval;
    if (!this.isMenuContext) playHitHurtSound();
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    this.projectiles.forEach(p => pts.push({ x: p.x, y: p.y, radius: 14, type: 'flame', projectileRef: p }));
    return pts;
  }
  draw(ctx) {
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.fillStyle = LavaGun.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
  playHitSound() { playHitHurtSound(); }
  canAttack() { return true; }
}