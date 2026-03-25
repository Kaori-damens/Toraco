// Crusher: no external weapon, but can squish-kill opponents against arena walls/corners.
import { Weapon } from './base.js';

export class Crusher extends Weapon {
  static color = '#555555';
  static icon = 'crusher_icon.png';

  constructor(player) {
    super(player);
    // No sprite; Crusher uses only the ball body.
    // Make Crusher heavier and a bit slower to feel "weighty"
    player.mass = player.radius * player.radius * 3; // 3x mass
    player.speed = Math.max(6, player.speed * 0.75); // slightly slower base speed
    this.damage = 0; // direct weapon doesn't deal damage; squish logic handles kills
  }

  // No-op updates/draws because the Crusher has no separate weapon
  update(isPlayerStunned) {}
  draw(ctx) {}

  // No weapon collision points — only the body collides
  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;
    return pts;
  }

  // Minimal display text
  getDamageDisplayText() {
    return `Crusher`;
  }

  // Crusher doesn't interact with parry/immunity logic
  canAttack() { return true; }
  getHitStunDurations() { return { attacker: 0, defender: 0 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
}