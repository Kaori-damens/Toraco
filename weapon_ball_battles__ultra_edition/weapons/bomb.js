/* Bomb: single-use projectile that explodes on contact or after timer */
import { Weapon } from './base.js';
import { playHitHurtSound } from '../audio.js';
import { players } from '../state.js';

export class Bomb extends Weapon {
  static color = '#333333';
  static icon = 'test_ball_icon.png';
  constructor(player) {
    super(player);
    this.projectiles = [];
    this.cooldown = 0;
    this.interval = 90;
    this.speed = 6;
  }
  update(isPlayerStunned) {
    if (!isPlayerStunned && this.cooldown <= 0) {
      this.shoot();
    }
    if (this.cooldown > 0) this.cooldown--;
    this.projectiles = this.projectiles.filter(p => {
      p.vy += 0.18;
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) {
        this.explode(p);
        return false;
      }
      const c = document.getElementById('gameCanvas');
      if (c && (p.x < -20 || p.x > c.width + 20 || p.y < -20 || p.y > c.height + 20)) {
        this.explode(p);
        return false;
      }
      return true;
    });
  }
  shoot() {
    if (this.cooldown > 0) return;
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    const startX = this.player.x + ca * (this.player.radius + 10);
    const startY = this.player.y + sa * (this.player.radius + 10);
    this.projectiles.push({ x: startX, y: startY, vx: ca * this.speed, vy: sa * this.speed, life: 240, kind: 'bomb', projectileRef: null });
    this.cooldown = this.interval;
  }
  explode(p) {
    // simple AoE damage
    const cx = p.x, cy = p.y;
    const rKill = 30, rBlast = 120;
    players.forEach(pl => {
      if (!pl || !pl.isAlive) return;
      const d = Math.hypot(pl.x - cx, pl.y - cy);
      if (d <= rKill) {
        pl.health = 0;
        if (pl.isAlive) { pl.isAlive = false; pl.spawnFragments(); }
      } else if (d <= rBlast) {
        const dmg = Math.max(2, Math.round(12 * (1 - (d - rKill) / (rBlast - rKill))));
        pl.health -= dmg;
        pl.vx += (pl.x - cx) / (d || 1) * 8;
        pl.vy += (pl.y - cy) / (d || 1) * 8;
        if (pl.health <= 0) { pl.health = 0; if (pl.isAlive) { pl.isAlive = false; pl.spawnFragments(); } }
      }
    });
    playHitHurtSound();
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    this.projectiles.forEach(p => pts.push({ x: p.x, y: p.y, radius: 12, type: 'bomb', projectileRef: p }));
    return pts;
  }
  draw(ctx) {
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.fillStyle = Bomb.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
  }
  canAttack() { return true; }
}