// Staff: rotates through random magic modes periodically.
// Modes:
// - Red (Forcefield): Creates a deflecting ring that can block/deflect projectiles and deals contact damage.
// - Green (Radius Expansion): Gradually grows radius while active (temporary). More size => more damage.
// - Blue (Radius Contraction): Gradually shrinks radius while active (temporary). Smaller => less damage, slightly faster.
// - Black (Shadow): Phases the user (continuous immunity while active).
// - Purple (Poison): On hit, applies 1 poison stack (like Scythe).
//
// Damage display shows current magic and a small readout.

import { Weapon } from './base.js';
import { playSwordHitSound, playHitHurtSound, playScytheHitSound } from '../audio.js';

export class Staff extends Weapon {
  static color = '#e6c36a'; // base golden staff tint
  static icon = 'staff_icon.png';

  constructor(player) {
    super(player);

    this.damage = 1;
    this.modeDurationFrames = 360; // ~6s
    this.modeTimer = 0;

    this.modes = ['forcefield', 'expand', 'shrink', 'shadow', 'poison'];
    this.currentMode = null;

    // Tunables
    this.growRate = 0.08;
    this.shrinkRate = 0.08;
    this.minRadius = 18;
    this.maxRadius = 120;

    // Remember base speed to scale for expand/shrink
    this.baseSpeed = player.speed || 10;

    // Colors per mode
    this.modeColors = {
      forcefield: '#ff3b3b', // red
      expand:     '#2ecc71', // green
      shrink:     '#3498db', // blue
      shadow:     '#000000', // black
      poison:     '#AA3FFF', // purple
    };

    // Start with a random mode
    this.switchToRandomMode();
  }

  switchToRandomMode() {
    const prev = this.currentMode;
    const options = this.modes.filter(m => m !== prev);
    this.currentMode = options[Math.floor(Math.random() * options.length)] || this.modes[0];
    this.modeTimer = 0;

    // Set player color to match the mode so it's visually clear
    const color = this.modeColors[this.currentMode] || Staff.color;
    this.player.color = color;
    this.player.originalColor = color;
    // parseColor happens in Player.setWeapon; here we just update for runtime
  }

  update(isPlayerStunned) {
    // Mode timer
    this.modeTimer++;
    if (this.modeTimer >= this.modeDurationFrames) {
      this.switchToRandomMode();
    }

    // Staff spins slowly
    if (!isPlayerStunned) {
      this.angle += 0.06 * this.spinDirection;
    }

    // Apply mode-specific continuous effects
    switch (this.currentMode) {
      case 'expand': {
        const r = this.player.radius;
        const newR = Math.min(this.maxRadius, r + this.growRate);
        if (newR !== r) {
          this.player.radius = newR;
          this.player.mass = newR * newR;
          const scale = Math.sqrt(35 / newR);
          this.player.speed = Math.max(4, Math.min(12, this.baseSpeed * scale));
        }
        // Damage scales mildly with size
        const scaled = 1 + (this.player.radius - 35) / 20;
        this.damage = Math.max(1, Math.min(5, Math.round(scaled)));
        break;
      }
      case 'shrink': {
        const r = this.player.radius;
        const newR = Math.max(this.minRadius, r - this.shrinkRate);
        if (newR !== r) {
          this.player.radius = newR;
          this.player.mass = newR * newR;
          // Smaller => slightly faster
          const speedScale = Math.sqrt(35 / Math.max(18, newR));
          this.player.speed = Math.max(5, Math.min(14, this.baseSpeed * (1 / Math.max(0.75, Math.sqrt(newR / 35)))));
        }
        // Damage scales mildly down with size
        const raw = this.player.radius / 60;
        this.damage = Math.max(0.5, Math.min(2, parseFloat(raw.toFixed(2))));
        break;
      }
      case 'shadow': {
        // Continuous immunity while active
        this.player.isImmune = true;
        this.player.immunityTimer = 2; // keep it alive every frame
        this.damage = 1;
        break;
      }
      case 'poison': {
        // Flat damage; poison is applied on hit
        this.damage = 1;
        break;
      }
      case 'forcefield':
      default: {
        // Modest damage; ring handles extra contact
        this.damage = 1.2;
        break;
      }
    }
  }

  onHit(defender) {
    if (this.currentMode === 'poison') {
      if (typeof defender.poisonStacks !== 'number') defender.poisonStacks = 0;
      if (typeof defender.poisonCycleFrames !== 'number') defender.poisonCycleFrames = 300;
      if (typeof defender.poisonElapsedFrames !== 'number') defender.poisonElapsedFrames = 0;
      defender.poisonStacks += 1;

      // Visual feedback for poison
      defender.poisonFlashFrames = defender.poisonFlashMax || 12;
    }
  }

  // Hit stun varies slightly by mode to give different feel
  getHitStunDurations() {
    switch (this.currentMode) {
      case 'forcefield': return { attacker: 4, defender: 8 };
      case 'shadow':     return { attacker: 4, defender: 6 };
      case 'expand':     return { attacker: 6, defender: 6 };
      case 'shrink':     return { attacker: 4, defender: 6 };
      case 'poison':     return { attacker: 6, defender: 6 };
      default:           return { attacker: 6, defender: 6 };
    }
  }

  canAttack(isPlayerStunned) { return !isPlayerStunned; }
  grantsImmunityOnHit() { return this.currentMode === 'shadow'; }
  shouldReverseOnHit() { return false; }

  playHitSound() {
    if (this.currentMode === 'poison') return playScytheHitSound();
    if (this.currentMode === 'forcefield') return playHitHurtSound();
    return playSwordHitSound();
  }

  getDamageDisplayText() {
    const label =
      this.currentMode === 'forcefield' ? 'Forcefield' :
      this.currentMode === 'expand' ? 'Radius+' :
      this.currentMode === 'shrink' ? 'Radius-' :
      this.currentMode === 'shadow' ? 'Shadow' :
      this.currentMode === 'poison' ? 'Poison' : 'Magic';

    if (this.currentMode === 'expand' || this.currentMode === 'shrink') {
      const size = Math.round(this.player.radius);
      const dmg = (Math.round(this.damage * 10) / 10).toFixed(1);
      return `${label} • Size: ${size} • Dmg: ${dmg}`;
    }

    return `${label} • Dmg: ${this.damage}`;
  }

  // Collision points:
  // - Base front-point for contact/hits.
  // - When 'forcefield' is active, add a ring of samples around the player to deflect projectiles and allow parries.
  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;

    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);
    const forwardR = this.player.radius + 8;
    pts.push({
      x: this.player.x + ca * forwardR,
      y: this.player.y + sa * forwardR,
      radius: 10,
    });

    if (this.currentMode === 'forcefield') {
      const ringR = this.player.radius + 22;
      const samples = 10;
      const ringRadius = Math.max(10, Math.round(10 * this.getScale()));
      for (let i = 0; i < samples; i++) {
        const a = (i / samples) * Math.PI * 2;
        pts.push({
          x: this.player.x + Math.cos(a) * ringR,
          y: this.player.y + Math.sin(a) * ringR,
          radius: ringRadius,
          type: 'staff-field'
        });
      }
    }

    return pts;
  }

  draw(ctx) {
    // Simple staff rod and orb indicator that changes color per mode
    const color = this.modeColors[this.currentMode] || Staff.color;

    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.angle);

    const s = this.getScale();
    const rodLen = 90 * s;
    const rodWidth = Math.max(4, 6 * s);

    // Rod
    ctx.strokeStyle = '#8b6a2b';
    ctx.lineWidth = rodWidth;
    ctx.beginPath();
    ctx.moveTo(this.player.radius, 0);
    ctx.lineTo(this.player.radius + rodLen, 0);
    ctx.stroke();

    // Orb at the tip
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const orbR = Math.max(8, 10 * s);
    ctx.arc(this.player.radius + rodLen + orbR * 0.4, 0, orbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Optional: faint forcefield ring when active
    if (this.currentMode === 'forcefield') {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5;
      ctx.arc(0, 0, this.player.radius + 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}