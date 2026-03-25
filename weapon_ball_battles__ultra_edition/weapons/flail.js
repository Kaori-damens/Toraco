// Flail: spiked ball on a chain that swings around the player
import { Weapon } from './base.js';
import { playHitHurtSound } from '../audio.js';

export class Flail extends Weapon {
  static color = '#cfcfcf';
  static icon = 'scythe_icon.png'; // reuse scythe icon as a flail head

  constructor(player) {
    super(player);
    this.damage = 1.4;
    this.chainLength = 90;   // distance from player to ball
    this.headRadius = 14;    // collision/draw radius
    this.spinSpeed = 0.09;   // swing speed
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      this.angle += this.spinSpeed * this.spinDirection;
    }
  }

  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;

    const s = this.getScale();
    const len = this.chainLength * s;
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);

    const headX = this.player.x + ca * (this.player.radius + len);
    const headY = this.player.y + sa * (this.player.radius + len);

    pts.push({
      x: headX,
      y: headY,
      radius: this.headRadius * s
    });

    return pts;
  }

  draw(ctx) {
    const s = this.getScale();
    const len = this.chainLength * s;
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);

    const startX = this.player.x + ca * this.player.radius;
    const startY = this.player.y + sa * this.player.radius;
    const headX = this.player.x + ca * (this.player.radius + len);
    const headY = this.player.y + sa * (this.player.radius + len);

    ctx.save();

    // Chain
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(headX, headY);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.fillStyle = Flail.color;
    ctx.arc(headX, headY, this.headRadius * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  playHitSound() { playHitHurtSound(); }
  canAttack() { return true; }

  getHitStunDurations() {
    return { attacker: 4, defender: 10 };
  }

  getDamageDisplayText() {
    return `Flail • Dmg: ${this.damage.toFixed(1)}`;
  }
}