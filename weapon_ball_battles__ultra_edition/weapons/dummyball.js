import { Weapon } from './base.js';

// DummyBall: training ball with infinite health (if requested) — minimal implementation to prevent runtime errors.
export class DummyBall extends Weapon {
  static color = '#cccccc';
  // Use the existing unarmed fist icon asset
  static icon = 'unarmed_icon%20(2).png';

  constructor(player) {
    super(player);
    this.damage = 0;
  }

  update() {}
  draw() {}
  getCollisionPoints() { return this._points; }
  getDamageDisplayText() { return 'Dummy'; }
  canAttack() { return false; }
  getHitStunDurations() { return { attacker: 0, defender: 0 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
}

// TestBall: simple basic test ball used in selections; behaves like Basic but explicit class so missing symbol errors stop.
export class TestBall extends Weapon {
  static color = 'white';
  static icon = 'test_ball_icon.png';

  constructor(player) {
    super(player);
    this.damage = 1;
  }

  update() {}
  draw() {}
  getCollisionPoints() { return this._points; }
  getDamageDisplayText() { return 'Test'; }
  canAttack() { return true; }
  getHitStunDurations() { return { attacker: 0, defender: 6 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
}