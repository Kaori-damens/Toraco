// Shrinker: no external weapon. The ball slowly shrinks over time and deals contact damage.
// Shrinking affects mass and movement speed (smaller => slightly faster).
import { Weapon } from './base.js';
import { playBoingSoundWithPitch, playHitHurtSound } from '../audio.js';

export class Shrinker extends Weapon {
  static color = '#3498db'; // bright blue
  static icon = 'shrinker_icon.png';

  constructor(player) {
    super(player);
    this.damage = 0.5; // dynamic; updated each frame based on size
    this.shrinkRate = 0.06; // pixels per frame
    this.minRadius = 0;     // CHANGED: allow shrinking down to 0 (pop!)
    this.maxRadius = 120;
    this.baseSpeed = player.speed || 10;

    // Collision "aura" just outside the body to register contact hits
    this.contactPadding = 8;
    this.contactRadius = 10;
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      // Shrink toward 0, and "pop" when we reach it
      const r = this.player.radius;
      const newR = Math.max(0, r - this.shrinkRate);
      if (newR !== r) {
        this.player.radius = newR;
        // Update mass ~ r^2 (avoid negative/NaN)
        this.player.mass = Math.max(0, this.player.radius * this.player.radius);

        // Smaller = faster (but clamp and guard zero)
        // As r -> 0, keep speed capped to avoid infinite acceleration.
        if (newR > 2) {
          const scale = 1 / Math.max(0.75, Math.sqrt(newR / 35));
          this.player.speed = Math.max(4, Math.min(14, this.baseSpeed * scale));
        } else {
          this.player.speed = 14; // near-pop: let it feel very zippy before popping
        }
      }

      // POP! If radius hits zero, the Shrinker dies
      if (this.player.radius <= 0 && this.player.isAlive) {
        this.player.health = 0;
        this.player.isAlive = false;
        this.player.spawnFragments();
        // High-pitched pop when the Shrinker reaches zero size
        playBoingSoundWithPitch(3.2, 0.18);
        // NEW: speech bubble
        if (this.player.say) this.player.say('POP!', 50);
        return; // no further updates needed once popped
      }
    }

    // Damage scales down with size (shrinker deals less damage)
    // ~0.6 dmg at r=35, ~0.3 at r=18, ~1 at r=60. Clamp between 0.2 and 1.2.
    const rNow = this.player.radius;
    const raw = rNow / 60; // 35 -> ~0.58
    this.damage = Math.max(0.2, Math.min(1.2, parseFloat(raw.toFixed(2))));
  }

  // No external visuals
  draw(ctx) {}

  // Contact-based collision point around the body (ignored by parry logic via type 'body')
  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;
    if (!this.player.isAlive || this.player.radius <= 0) return pts; // nothing to collide with if popped
    const r = this.player.radius + this.contactPadding;
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);
    pts.push({
      x: this.player.x + ca * r,
      y: this.player.y + sa * r,
      radius: this.contactRadius,
      type: 'body'
    });
    return pts;
  }

  getDamageDisplayText() {
    const size = Math.max(0, Math.round(this.player.radius));
    const dmg = (Math.round(this.damage * 10) / 10).toFixed(1);
    return `Size: ${size} • Dmg: ${dmg}`;
  }

  canAttack() { return true; }
  getHitStunDurations() { return { attacker: 0, defender: 6 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
  playHitSound() { playHitHurtSound(); }
}