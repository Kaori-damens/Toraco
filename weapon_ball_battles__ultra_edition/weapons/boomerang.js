// Boomerang: thrown blade that arcs out and returns to the owner
import { Weapon } from './base.js';
import { playHitHurtSound } from '../audio.js';

export class Boomerang extends Weapon {
  static color = '#ffe082';
  static icon = 'shuriken.png'; // reuse shuriken icon as a boomerang glyph

  constructor(player) {
    super(player);
    this.damage = 1.0;
    this.projectiles = [];
    this.cooldown = 0;
    this.interval = 45; // frames between throws
    this.speed = 10;
    this.flightTime = 40; // frames before it starts returning
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned && this.cooldown <= 0) {
      this.throwBoomerang();
    }
    if (this.cooldown > 0) this.cooldown--;

    const canvas = document.getElementById('gameCanvas');

    this.projectiles = this.projectiles.filter(p => {
      p.age++;

      // Outward phase: straight line
      if (p.age < this.flightTime) {
        // keep current velocity
      } else {
        // Return phase: home in towards player
        const dx = this.player.x - p.x;
        const dy = this.player.y - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        const homingSpeed = this.speed;
        p.vx = (dx / dist) * homingSpeed;
        p.vy = (dy / dist) * homingSpeed;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0) return false;

      if (canvas) {
        if (p.x < -20 || p.x > canvas.width + 20 ||
            p.y < -20 || p.y > canvas.height + 20) {
          return false;
        }
      }

      return true;
    });
  }

  throwBoomerang() {
    if (this.cooldown > 0) return;
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);

    const startX = this.player.x + ca * (this.player.radius + 12);
    const startY = this.player.y + sa * (this.player.radius + 12);

    this.projectiles.push({
      x: startX,
      y: startY,
      vx: ca * this.speed,
      vy: sa * this.speed,
      age: 0,
      life: 160,
      kind: 'boomerang',
      projectileRef: null,
      radius: 14
    });

    this.cooldown = this.interval;
    if (!this.isMenuContext) playHitHurtSound();
  }

  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;
    this.projectiles.forEach(p => {
      pts.push({
        x: p.x,
        y: p.y,
        radius: p.radius || 14,
        type: 'boomerang',
        projectileRef: p
      });
    });
    return pts;
  }

  draw(ctx) {
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);

      ctx.fillStyle = '#ffe082';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;

      const w = 26;
      const h = 8;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h);
      ctx.lineTo(0, 0);
      ctx.lineTo(w / 2, -h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });
  }

  playHitSound() { playHitHurtSound(); }
  canAttack() { return true; }

  getHitStunDurations() {
    return { attacker: 0, defender: 6 };
  }

  getDamageDisplayText() {
    return `Boomerang • Dmg: ${this.damage.toFixed(1)}`;
  }
}