/* Base classes and simple "no-asset" weapons shared by others.
   Added: static ability text and helper method to expose it. */

class Weapon {
  // Default ability text for weapons that don't override it
  static ability = 'No special ability';

  constructor(player) {
    this.player = player;
    this.image = new Image();
    this.tintCanvas = document.createElement('canvas');
    this.tintColor = 'rgba(255, 0, 0, 0)';
    this.angle = -Math.PI / 2;
    this.spinDirection = 1;
    this.damage = 0;
    this.isMenuContext = false;

    // Reusable points buffer to avoid per-frame allocations
    this._points = [];
  }
  // Intentionally empty so concrete weapons override as needed
  update(isPlayerStunned) {}
  draw(ctx) {}
  getCollisionPoints() { return this._points; }
  onHit(defender) {}
  onStunEnd() {}
  onSuccessfulHit() {}

  canAttack(isPlayerStunned) { return false; }
  getHitStunDurations() { return { attacker: 0, defender: 0 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
  playHitSound() {}
  getDamageDisplayText() { return ''; }

  // Expose the static ability text (instance helper)
  getAbility() {
    return this.constructor.ability || Weapon.ability;
  }

  // NEW: notify weapons about wall bounces so they can adjust heading if needed
  onWallBounce(axis /* 'x' or 'y' */) {}

  // NEW: scale helper so big bosses have big weapons/hitboxes
  getScale() {
    const base = 35; // base radius used for standard sizes
    const r = (this.player && this.player.radius) ? this.player.radius : base;
    return Math.max(0.5, Math.min(5, r / base));
  }
}

class NoWeapon extends Weapon {
  // No visuals, no damage, no abilities.
  static ability = 'None';
}

class Basic extends NoWeapon {
  static color = 'white';
  // Use the existing test ball icon as the generic "basic" icon
  static icon = 'test_ball_icon.png';
  static ability = 'A simple ball — no special ability.';
}

export { Weapon, NoWeapon, Basic };