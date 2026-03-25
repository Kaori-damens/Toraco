// Grower: no external weapon. The ball slowly grows over time and deals contact damage.
// Growth affects mass and a bit of movement speed (bigger => slightly slower).
import { Weapon } from './base.js';
import { playHitHurtSound, playBoingSoundWithPitch } from '../audio.js';
import { players } from '../state.js';

export class Grower extends Weapon {
  static color = '#2ecc71'; // bright green
  static icon = 'grower_icon.png';

  constructor(player) {
    super(player);
    this.damage = 1; // dynamic; updated each frame based on size
    this.growRate = 0.06; // pixels per frame
    this.minRadius = 18;
    this.maxRadius = 200; // INCREASED: can grow all the way to 200 and then explode
    this.baseSpeed = player.speed || 10; // remember starting point

    // Collision "aura" just outside the body to register contact hits
    this.contactPadding = 8;
    this.contactRadius = 10;

    this._hasExploded = false;
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      // Grow toward max
      const r = this.player.radius;
      const newR = Math.min(this.maxRadius, r + this.growRate);
      if (newR !== r) {
        this.player.radius = newR;
        // Update mass ~ r^2
        this.player.mass = this.player.radius * this.player.radius;

        // Slight speed scaling: bigger = slower (but never too slow)
        const scale = Math.sqrt(35 / this.player.radius);
        this.player.speed = Math.max(4, Math.min(12, this.baseSpeed * scale));
      }
    }

    // EXPLODE at max size (200)
    if (!this._hasExploded && this.player.isAlive && this.player.radius >= this.maxRadius) {
      this._hasExploded = true;

      // BIG BOOM: deep, loud pop equivalent
      playBoingSoundWithPitch(0.5, 0.5);
      // NEW: speech bubble
      if (this.player.say) this.player.say('BOOM!', 60);

      // Area-of-effect: kill those too close, blast others back and damage them
      const cx = this.player.x;
      const cy = this.player.y;
      const killRadius = 180;   // instant-kill radius (from center)
      const blastRadius = 320;  // beyond kill, apply knockback and damage

      players.forEach((p) => {
        if (!p || p === this.player || !p.isAlive) return;
        // NEW: prevent friendly fire in multi-player team modes
        if (players.length > 2 && this.player.team && p.team && this.player.team === p.team) return;

        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);

        if (dist <= killRadius) {
          // Too close: instant death (except for Dummy Ball)
          if (p.type !== 'dummyball' && isFinite(p.health)) {
              p.health = 0;
              if (p.isAlive) {
                p.isAlive = false;
                p.spawnFragments();
              }
          }
        } else if (dist <= blastRadius) {
          // Apply damage falloff and strong knockback
          const falloff = 1 - (dist - killRadius) / (blastRadius - killRadius); // 1..0
          const damage = Math.max(5, Math.round(25 * falloff));
          
          if (p.type !== 'dummyball' && isFinite(p.health)) {
              p.health -= damage;
          }

          // Normalize direction and apply impulse
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          const force = 18 * falloff; // strong knockback near the blast edge
          p.vx += nx * force;
          p.vy += ny * force;

          // Brief squash to sell the blast impact
          if (typeof p.triggerSquash === 'function') {
            const axis = Math.abs(nx) > Math.abs(ny) ? 'x' : 'y';
            p.triggerSquash(axis, 0.6);
          }

          // If this pushed health to/below zero, finalize death
          if (p.health <= 0) {
            p.health = 0;
            if (p.isAlive) {
              p.isAlive = false;
              p.spawnFragments();
            }
          }
        }
      });

      // Death + fragments for the Grower itself
      this.player.health = 0;
      this.player.isAlive = false;
      this.player.spawnFragments();
      return; // no more updates once exploded
    }

    // Damage scales up with size (grower deals more damage)
    // ~2 dmg at r=35, ~5 dmg at r=90, clamped 1..7
    const r = this.player.radius;
    const scaled = 1 + (r - 35) / 15;
    this.damage = Math.max(1, Math.min(7, Math.round(scaled)));
  }

  // No external visuals
  draw(ctx) {}

  // Contact-based collision point around the body.
  // Type 'body' so parry logic and weapon-to-weapon clashes ignore it (handled in collision.js).
  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;
    if (!this.player.isAlive) return pts;
    const r = this.player.radius + this.contactPadding;
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);
    // One sample in front of travel/weapon angle direction to favor forward hits
    pts.push({
      x: this.player.x + ca * r,
      y: this.player.y + sa * r,
      radius: this.contactRadius,
      type: 'body'
    });
    return pts;
  }

  getDamageDisplayText() {
    const size = Math.round(this.player.radius);
    if (size >= 200) return `Size: 200 • BOOM!`;
    const warn = size >= 180 ? ' • BURST SOON!' : (size >= 100 ? ' • CRUSH!' : '');
    return `Size: ${size}${warn} • Dmg: ${this.damage}`;
  }

  canAttack() { return true; }
  getHitStunDurations() { return { attacker: 0, defender: 6 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
  playHitSound() { playHitHurtSound(); }
}