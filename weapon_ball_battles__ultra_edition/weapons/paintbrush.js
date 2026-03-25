/* Paintbrush: splashes colourful blobs (visual) */
import { Weapon } from './base.js';
export class Paintbrush extends Weapon {
  static color = '#ff88cc';
  static icon = 'test_ball_icon.png';
  constructor(player) {
    super(player);
    this.damage = 0.3;
    this.splats = [];
  }
  update(isPlayerStunned) {
    this.splats = this.splats.filter(s => { s.life--; return s.life > 0; });
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    this.splats.forEach(s => pts.push({ x: s.x, y: s.y, radius: s.radius, type: 'paint', projectileRef: s }));
    return pts;
  }
  draw(ctx) {
    this.splats.forEach(s => { ctx.save(); ctx.fillStyle = s.color; ctx.globalAlpha = (s.life/60); ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2); ctx.fill(); ctx.restore(); });
  }
  // create a splat (caller may invoke when firing, simplified usage)
  splatAt(x, y) { this.splats.push({ x, y, radius: 10 + Math.random()*10, color: `hsl(${Math.random()*360}|0.7|0.6)`.replace('|', ','), life: 60 }); }
  canAttack() { return false; }
}