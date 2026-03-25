/*
  Unarmed: "Anime" revamp — flashy aura, faster charge, stronger speed scaling,
  and a breezy visual representation while preserving gameplay hooks.
*/
import { Weapon } from './base.js';
import { playUnarmedHitSound } from '../audio.js';

export class Unarmed extends Weapon {
  static color = '#FFEFA6'; // warmer, anime highlight
  static icon = 'unarmed_icon%20(2).png';

  constructor(player) {
    super(player);
    // More aggressive charge curve and cap
    this.maxCharge = 6;           // bigger max to feel dramatic
    this.currentCharge = 0;
    this.canHit = true;
    this._cooldownFrames = 0;
    this._cooldownMax = 10;      // tighter mini-cooldown
    this.originalSpeed = player.speed;
    player.speed = 0;

    // Anime-style burst heading
    this._dirAngle = Math.random() * Math.PI * 2;
    const initialNudge = 1.6; // stronger initial push
    this.player.vx = Math.cos(this._dirAngle) * initialNudge;
    this.player.vy = Math.sin(this._dirAngle) * initialNudge;

    // Visual pulse state
    this.pulse = 0;
    this.pulseRate = 0.09;
    this.pulseMax = 1.6;
  }

  setHeadingFromVelocity(vx, vy) {
    const mag = Math.hypot(vx, vy);
    if (mag > 0.0001) {
      this._dirAngle = Math.atan2(vy, vx);
    }
  }

  onWallBounce(axis) {
    // Reflect heading and add an "anime spin" burst
    if (axis === 'x') this._dirAngle = Math.PI - this._dirAngle;
    else if (axis === 'y') this._dirAngle = -this._dirAngle;
    // Visual pulse spike
    this.pulse = Math.min(this.pulseMax, this.pulse + 0.9);
  }

  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;
    // Slightly larger hit radius to match flashy anime contact
    pts.push({
      x: this.player.x,
      y: this.player.y,
      radius: Math.max(6, this.player.radius + 6)
    });
    return pts;
  }

  update(isPlayerStunned) {
    if (this._cooldownFrames > 0) {
      this._cooldownFrames--;
      if (this._cooldownFrames <= 0) this.canHit = true;
    }

    if (!isPlayerStunned) {
      // Faster ramp to max, with ease-out feel
      const framesToMax = 90; // faster than before
      const linearRate = this.maxCharge / framesToMax;
      const minFloor = 0.04;
      const rate = Math.max(minFloor, linearRate);

      if (this.currentCharge < this.maxCharge) {
        this.currentCharge = Math.min(this.maxCharge, this.currentCharge + rate);
      }
    }

    // Stronger damage-speed coupling (anime burst)
    this.damage = Math.floor(this.currentCharge * 1.25);
    this.player.speed = this.currentCharge * 1.25;

    // Steering: keep vertical gravity but steer horizontal toward heading
    const desired = this.player.speed;
    if (desired > 0) {
      const nx = Math.cos(this._dirAngle);
      this.player.vx = nx * desired;
    }

    // Pulse decay
    this.pulse = Math.max(0, this.pulse - this.pulseRate);
  }

  canAttack(isPlayerStunned) {
    return this.canHit && !isPlayerStunned;
  }

  onHit(defender) {
    // Anime impact: discharge some charge and grow permanently a bit
    this.currentCharge = Math.max(0, this.currentCharge - 1);
    this.maxCharge = Math.min(12, this.maxCharge + 0.5);
    this.player.speed = 0;
    // small visual pulse
    this.pulse = this.pulseMax;
  }

  getHitStunDurations() {
    return { attacker: 3, defender: 9 }; // slightly different feel
  }

  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }

  onSuccessfulHit() {
    this.canHit = false;
    this._cooldownFrames = this._cooldownMax;
  }

  playHitSound() {
    playUnarmedHitSound();
  }

  getDamageDisplayText() {
    const maxInt = Math.round(this.maxCharge);
    const curInt = Math.round(this.currentCharge);
    return `<span class="unarmed-info">Anime Charge: ${curInt}/${maxInt} • Dmg: ${this.damage}</span>`;
  }

  draw(ctx) {
    // Minimal visual aura: a colored shimmer and starburst when pulsing
    if (!this.player || !this.player.isAlive) return;
    const s = this.getScale ? this.getScale() : 1;
    ctx.save();
    // Aura
    const alpha = 0.25 + Math.min(0.75, this.pulse / this.pulseMax);
    ctx.globalAlpha = alpha;
    const grd = ctx.createRadialGradient(this.player.x, this.player.y, 0, this.player.x, this.player.y, this.player.radius * 3);
    grd.addColorStop(0, 'rgba(255, 235, 120, 0.95)');
    grd.addColorStop(0.5, 'rgba(255, 160, 200, 0.35)');
    grd.addColorStop(1, 'rgba(255, 160, 200, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius * 3.2 * s, 0, Math.PI * 2);
    ctx.fill();

    // Starburst when pulse high
    if (this.pulse > 0.25) {
      ctx.globalAlpha = Math.min(0.9, this.pulse / this.pulseMax);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2 * s;
      for (let i = 0; i < 8; i++) {
        const a = i * (Math.PI * 2 / 8) + (this.pulse * 0.6);
        ctx.beginPath();
        ctx.moveTo(this.player.x + Math.cos(a) * this.player.radius * 1.1, this.player.y + Math.sin(a) * this.player.radius * 1.1);
        ctx.lineTo(this.player.x + Math.cos(a) * this.player.radius * (2.6 + this.pulse * 0.6), this.player.y + Math.sin(a) * this.player.radius * (2.6 + this.pulse * 0.6));
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}