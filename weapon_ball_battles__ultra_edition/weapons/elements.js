import { Weapon } from './base.js';
import { playSwordHitSound, playHitHurtSound, playLightningZapSound, playScytheHitSound } from '../audio.js';
import { players } from '../state.js';

// Fire God: Burns enemies on hit and has a heat aura
export class FireGod extends Weapon {
  static color = '#FF4500';
  static icon = 'fire_god_icon.png';
  constructor(player) {
    super(player);
    this.damage = 1.5;
    this.auraRadius = 120;
  }
  update(stunned) {
    if (!stunned) {
      this.angle += 0.12 * this.spinDirection;
      // Heat aura: damage nearby enemies slightly
      players.forEach(p => {
        if (!p || p === this.player || !p.isAlive) return;
        if (players.length > 2 && this.player.team && p.team && this.player.team === p.team) return;
        const d = Math.hypot(this.player.x - p.x, this.player.y - p.y);
        if (d < this.auraRadius) {
          p.health -= 0.02; // Small tick damage
          if (Math.random() < 0.05) p.say('Hot!', 20);
        }
      });
    }
  }
  onHit(def) {
    // Apply burn (reusing bleed logic)
    def.axeBleedFrames = Math.max(def.axeBleedFrames || 0, 180);
    def.axeBleedInterval = 20;
    def.say('Burning!', 40);
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale(), ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    for (let i = 0; i < 4; i++) {
      const d = this.player.radius + 10 + i * 25 * s;
      pts.push({ x: this.player.x + ca * d, y: this.player.y + sa * d, radius: 12 * s });
    }
    return pts;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    // Draw fire aura
    ctx.beginPath();
    ctx.arc(0, 0, this.auraRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 69, 0, 0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Draw fire blade
    ctx.rotate(this.angle);
    const s = this.getScale();
    const g = ctx.createLinearGradient(this.player.radius, 0, this.player.radius + 100 * s, 0);
    g.addColorStop(0, '#ffcc00'); g.addColorStop(1, '#ff4500');
    ctx.fillStyle = g;
    ctx.fillRect(this.player.radius, -10 * s, 100 * s, 20 * s);
    ctx.restore();
  }
  getDamageDisplayText() { return 'Fire • Aura & Burn'; }
  canAttack(s) { return !s; }
  playHitSound() { playSwordHitSound(); }
}

// Grass God: Lifesteal and entangles enemies
export class GrassGod extends Weapon {
  static color = '#228B22';
  static icon = 'grass_god_icon.png';
  constructor(player) { super(player); this.damage = 1.2; }
  update(stunned) { if (!stunned) this.angle += 0.07 * this.spinDirection; }
  onHit(def) {
    // Lifesteal
    this.player.health = Math.min(100, this.player.health + 2);
    // Entangle (slow down enemy)
    def.vx *= 0.5; def.vy *= 0.5;
    def.say('Rooted!', 40);
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale(), ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    const d = this.player.radius + 60 * s;
    pts.push({ x: this.player.x + ca * d, y: this.player.y + sa * d, radius: 25 * s });
    return pts;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);
    const s = this.getScale();
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(this.player.radius + 50 * s, 0, 20 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  getDamageDisplayText() { return 'Grass • Lifesteal'; }
  canAttack(s) { return !s; }
  playHitSound() { playScytheHitSound(); }
}

// Water God: Slippery and pushes enemies away
export class WaterGod extends Weapon {
  static color = '#1E90FF';
  static icon = 'water_god_icon.png';
  constructor(player) { super(player); this.damage = 1.0; }
  update(stunned) { if (!stunned) this.angle += 0.09 * this.spinDirection; }
  onHit(def) {
    // Massive knockback
    const dx = def.x - this.player.x, dy = def.y - this.player.y;
    const d = Math.hypot(dx, dy) || 1;
    def.vx += (dx / d) * 15; def.vy += (dy / d) * 15;
    def.say('Splashed!', 40);
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale(), ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    pts.push({ x: this.player.x + ca * (this.player.radius + 40 * s), y: this.player.y + sa * (this.player.radius + 40 * s), radius: 30 * s });
    return pts;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);
    const s = this.getScale();
    ctx.fillStyle = 'rgba(30, 144, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(this.player.radius + 40 * s, 0, 40 * s, 25 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  getDamageDisplayText() { return 'Water • Tidal Push'; }
  canAttack(s) { return !s; }
  playHitSound() { playHitHurtSound(); }
}

// Air God: High speed and periodic lightning
export class AirGod extends Weapon {
  static color = '#F0F8FF';
  static icon = 'air_god_icon.png';
  constructor(player) {
    super(player);
    this.damage = 1.0;
    this.player.speed *= 1.4;
    this.zapTimer = 0;
  }
  update(stunned) {
    if (!stunned) {
      this.angle += 0.2 * this.spinDirection;
      this.zapTimer++;
      if (this.zapTimer > 120) {
        this.zap();
        this.zapTimer = 0;
      }
    }
  }
  zap() {
    const target = players.find(p => p !== this.player && p.isAlive);
    if (target) {
      target.health -= 5;
      target.stun(10);
      this.player.say('Zap!', 30);
      playLightningZapSound();
    }
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale(), ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    pts.push({ x: this.player.x + ca * (this.player.radius + 20 * s), y: this.player.y + sa * (this.player.radius + 20 * s), radius: 15 * s });
    return pts;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);
    const s = this.getScale();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(this.player.radius, 0); ctx.lineTo(this.player.radius + 40 * s, 0); ctx.stroke();
    ctx.restore();
  }
  getDamageDisplayText() { return 'Air • Speed & Lightning'; }
  canAttack(s) { return !s; }
  playHitSound() { playLightningZapSound(); }
}

// Soil God: Heavy and Earthquake on wall bounce
export class SoilGod extends Weapon {
  static color = '#8B4513';
  static icon = 'soil_god_icon.png';
  constructor(player) {
    super(player);
    this.damage = 2.0;
    this.player.mass *= 2.5;
    this.player.speed *= 0.7;
  }
  onWallBounce() {
    // Earthquake: stun all other players briefly
    players.forEach(p => {
      if (p !== this.player && p.isAlive) {
        p.stun(15);
        p.say('Quake!', 30);
      }
    });
    this.player.say('CRUSH!', 30);
  }
  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    const s = this.getScale(), ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    pts.push({ x: this.player.x + ca * (this.player.radius + 15 * s), y: this.player.y + sa * (this.player.radius + 15 * s), radius: 40 * s });
    return pts;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);
    const s = this.getScale();
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(this.player.radius, -20 * s, 40 * s, 40 * s);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(this.player.radius, -20 * s, 40 * s, 40 * s);
    ctx.restore();
  }
  getDamageDisplayText() { return 'Soil • Heavy & Quake'; }
  canAttack(s) { return !s; }
  playHitSound() { playHitHurtSound(); }
}