// weapons/italy.js
import { Weapon } from './base.js';
import { players } from '../state.js';

export class Italy extends Weapon {
  static color = '#009246';
  static icon = 'italy_icon.png';
  constructor(player) {
    super(player);
    this.damage = 1;
    this.lureRadius = 260;
    this.lureStrength = 0.12;
  }
  update(stunned) {
    if (!stunned) this.angle += 0.06 * this.spinDirection;
    // Lure nearby enemies (no friendly fire)
    players.forEach(p => {
      if (!p || p === this.player || !p.isAlive) return;
      if (players.length > 2 && this.player.team && p.team && this.player.team === p.team) return;
      const dx = this.player.x - p.x, dy = this.player.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d <= this.lureRadius) {
        const f = this.lureStrength * (1 - d / this.lureRadius);
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
    });
  }
  getHitStunDurations() { return { attacker: 4, defender: 6 }; }
  canAttack(s) { return !s; }
  getDamageDisplayText() { return 'Pizza • Lure'; }
  getCollisionPoints() { const pts = this._points; pts.length = 0; return pts; }
  draw(ctx) {
    // Draw a pizza at weapon tip
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);
    const s = this.getScale(), r = 16 * s, cx = this.player.radius + 28 * s;
    ctx.beginPath();
    ctx.arc(cx, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#F4A460'; // crust
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    // toppings (pepperoni dots)
    ctx.fillStyle = '#b22222';
    for (let i = 0; i < 4; i++) {
      const a = i * 1.5;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}