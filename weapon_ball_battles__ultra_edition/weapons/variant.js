// Base classes and simple "no-asset" weapons shared by others

class Weapon {
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

  // NEW: notify weapons about wall bounces so they can adjust heading if needed
  onWallBounce(axis /* 'x' or 'y' */) {}

  // NEW: scale helper so big bosses have big weapons/hitboxes
  getScale() {
    const base = 35; // base radius used for standard sizes
    const r = (this.player && this.player.radius) ? this.player.radius : base;
    return Math.max(0.5, Math.min(5, r / base));
  }
}


export class VariantMulti extends Weapon {
  constructor(player, BaseCls, count = 1, powerMultiplier = 1) {
    super(player);
    this.children = [];
    this.damage = 1;
    this.count = Math.max(1, count | 0);
    this.power = Math.max(0.5, powerMultiplier);

    for (let i = 0; i < this.count; i++) {
      const w = BaseCls ? new BaseCls(player) : null;
      if (w) {
        w.angle += (i - (this.count - 1) / 2) * 0.12;
        this.children.push(w);
      }
    }
  }

  update(isPlayerStunned) {
    let sum = 0;
    this.children.forEach(w => {
      w.isMenuContext = this.isMenuContext;
      w.gameFrameNumber = this.gameFrameNumber;
      w.spinDirection = this.spinDirection;
      w.update(isPlayerStunned);
      sum += (w.damage || 0);
    });
    this.damage = Math.max(0.5, sum * this.power);
  }

  draw(ctx) { this.children.forEach(w => w.draw(ctx)); }

  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    this.children.forEach(w => pts.push(...w.getCollisionPoints()));
    return pts;
  }

  onHit(defender) { this.children.forEach(w => { if (w.onHit) w.onHit(defender); }); }
  onSuccessfulHit() { this.children.forEach(w => { if (w.onSuccessfulHit) w.onSuccessfulHit(); }); }
  onStunEnd() { this.children.forEach(w => { if (w.onStunEnd) w.onStunEnd(); }); }

  canAttack(isPlayerStunned) {
    return this.children.some(w => w.canAttack ? w.canAttack(isPlayerStunned) : false);
  }

  getHitStunDurations() {
    let a = 0, d = 0;
    this.children.forEach(w => {
      const s = w.getHitStunDurations ? w.getHitStunDurations() : { attacker: 0, defender: 0 };
      a = Math.max(a, s.attacker); d = Math.max(d, s.defender);
    });
    return { attacker: a, defender: d };
  }

  grantsImmunityOnHit() {
    return this.children.some(w => w.grantsImmunityOnHit && w.grantsImmunityOnHit());
  }

  shouldReverseOnHit() {
    return this.children.some(w => w.shouldReverseOnHit && w.shouldReverseOnHit());
  }

  playHitSound() {
    if (this.children[0] && this.children[0].playHitSound) this.children[0].playHitSound();
  }

  onWallBounce(axis) { this.children.forEach(w => { if (w.onWallBounce) w.onWallBounce(axis); }); }

  getDamageDisplayText() {
    return `x${this.count} • Power: ${this.power.toFixed(2)} • Dmg: ${(Math.round(this.damage*10)/10).toFixed(1)}`;
  }
}