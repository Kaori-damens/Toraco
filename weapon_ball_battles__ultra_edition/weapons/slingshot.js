/* Slingshot: fires slow, arcing pebbles (single-shot) */
import { Weapon } from './base.js';
import { playBowHitSound } from '../audio.js';

export class Slingshot extends Weapon {
  static color = '#8B5A2B';
  // Reuse the brown bow icon to represent the slingshot in UI
  static icon = 'bow_icon.png';
  constructor(player) {
    super(player);
    this.projectiles = [];
    this.cooldown = 0;
    this.interval = 36;
    this.speed = 10;
    this.damage = 1;
  }
  update(isPlayerStunned) {
    if (!isPlayerStunned && this.cooldown <= 0) {
      this.shoot();
    }
    if (this.cooldown > 0) this.cooldown--;
    // advance projectiles
    this.projectiles = this.projectiles.filter(p => {
      p.vy += 0.12; // slight gravity
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
    this.projectiles.push({ x: startX, y: startY, vx: ca * this.speed, vy: sa * this.speed - 2, life: 120, kind: 'slingshot', projectileRef: null });
    this.cooldown = this.interval;
    if (!this.isMenuContext) playBowHitSound();
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    this.projectiles.forEach(p => pts.push({ x: p.x, y: p.y, radius: 10, type: 'slingshot', projectileRef: p }));
    return pts;
  }
  draw(ctx) {
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.fillStyle = Slingshot.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
  playHitSound() { playBowHitSound(); }
  canAttack() { return true; }
}