import { Weapon } from './base.js';
import { playGunShotSound, playHitHurtSound } from '../audio.js';

export class AK47 extends Weapon {
  static color = '#555555';
  static icon = 'ak47_icon.png';

  constructor(player) {
    super(player);
    this.damage = 1;
    this.fireRate = 3; 
    this.shootInterval = Math.max(1, Math.floor(60 / this.fireRate)); 
    this.timer = 0;

    this.bullets = [];
    this.bulletSpeed = 18;
    this.bulletLife = 90;
    this.bulletRadius = 8;

    this.gunLength = 70;
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      this.angle += 0.04 * this.spinDirection;
      this.timer--;
      if (this.timer <= 0) {
        this.shoot();
        this.timer = this.shootInterval;
      }
    }
    this.updateBullets();
  }

  shoot() {
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);
    const muzzleDist = this.player.radius + this.gunLength;
    const x = this.player.x + ca * muzzleDist;
    const y = this.player.y + sa * muzzleDist;

    const vx = ca * this.bulletSpeed;
    const vy = sa * this.bulletSpeed;

    this.bullets.push({
      x, y, vx, vy,
      life: this.bulletLife,
      projectileRef: null 
    });

    if (!this.isMenuContext) playGunShotSound();
  }

  updateBullets() {
    const canvas = document.getElementById('gameCanvas');
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      b.life--;
      if (b.life <= 0) return false;
      if (canvas) {
        if (b.x < -10 || b.x > canvas.width + 10 || b.y < -10 || b.y > canvas.height + 10) return false;
      }
      return true;
    });
  }

  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;

    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);
    const bodyR = this.player.radius + 10;
    pts.push({ x: this.player.x + ca * bodyR, y: this.player.y + sa * bodyR, radius: 8, type: 'gun' });

    this.bullets.forEach(b => {
      pts.push({
        x: b.x,
        y: b.y,
        radius: this.bulletRadius,
        type: 'ak-bullet',
        projectileRef: b
      });
    });

    return pts;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);

    const s = this.getScale();
    const len = this.gunLength * s;
    const w = Math.max(6, 10 * s);

    ctx.fillStyle = '#333';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillRect(this.player.radius, -w / 2, len, w);
    ctx.strokeRect(this.player.radius, -w / 2, len, w);

    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#222';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    this.bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, this.bulletRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  onHit() {
    playHitHurtSound();
  }

  playHitSound() { playGunShotSound(); }
  getHitStunDurations() { return { attacker: 4, defender: 6 }; }
  canAttack(isPlayerStunned) { return !isPlayerStunned; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
  getDamageDisplayText() { return `Bullets/s: ${this.fireRate}`; }
}