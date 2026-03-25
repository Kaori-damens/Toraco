import { Weapon } from './base.js';
import { Sword } from './sword.js';
import { Bow } from './bow.js';
import { Dagger } from './dagger.js';
import { Spear } from './spear.js';
import { Shuriken } from './shuriken.js';
import { Scythe } from './scythe.js';
import { Axe } from './axe.js';
import { Staff } from './staff.js';
import { SpeedBall } from './speedball.js';
import { Duplicator } from './duplicator.js';
import { Crusher } from './crusher.js';
import { Grower } from './grower.js';
import { Shrinker } from './shrinker.js';
import { Unarmed } from './unarmed.js';
import { AK47 } from './ak47.js';

const REGISTRY = {
  sword: Sword, bow: Bow, dagger: Dagger, spear: Spear, shuriken: Shuriken, scythe: Scythe,
  axe: Axe, staff: Staff, speedball: SpeedBall, duplicator: Duplicator, crusher: Crusher,
  grower: Grower, shrinker: Shrinker, unarmed: Unarmed, ak47: AK47, basic: null
};

export class Fuse extends Weapon {
  static color = '#7c7cff';
  static icon = 'fuse_icon.png';

  constructor(player, weaponA = 'sword', weaponB = 'bow') {
    super(player);
    // Keep pair order: baseWeapon (primary) first, modifier second
    this.pair = [weaponA, weaponB];

    // Instantiate primary (base) weapon and a lightweight modifier descriptor for the secondary
    const ACls = REGISTRY[weaponA] || Sword;
    const BCls = REGISTRY[weaponB] || Bow;
    this.wBase = ACls ? new ACls(player) : null;
    // Keep a secondary instance only for reference (not full behavior merge) so we can derive abilities
    this.wMod = BCls ? new BCls(player) : null;

    // Mark as fusion and prefer base behavior; damage will be derived from base + small modifier
    this.damage = this.wBase ? (this.wBase.damage || 1) : 1;
    this._applyModifierFlags();
  }

  // Keep primary weapon context in sync and apply modifier flags each frame
  syncChildrenContext(isPlayerStunned) {
    if (this.wBase) {
      this.wBase.isMenuContext = this.isMenuContext;
      this.wBase.gameFrameNumber = this.gameFrameNumber;
      this.wBase.spinDirection = this.spinDirection;
      this.wBase.angle = this.angle;
    }
    if (this.wMod) {
      // light sync so some info can be read/used, but we won't let the modifier override base transforms
      this.wMod.isMenuContext = this.isMenuContext;
      this.wMod.gameFrameNumber = this.gameFrameNumber;
    }
  }

  update(isPlayerStunned) {
    // Spin the shared angle; primary weapon handles core behavior
    if (!isPlayerStunned) this.angle += 0.07 * this.spinDirection;
    this.syncChildrenContext(isPlayerStunned);

    if (this.wBase) this.wBase.update(isPlayerStunned);

    // Apply conservative fusion modifiers derived from the secondary:
    // - small additive damage
    // - small spin/length/rate tweaks depending on modifier type
    this._applyFusionModifiers();

    // Keep displayed damage in sync with base + modifiers
    const baseDmg = this.wBase ? (this.wBase.damage || 0) : 0;
    this.damage = Math.max(0.5, Math.min(8, baseDmg + (this._modDamageBonus || 0)));
  }

  draw(ctx) {
    // Draw only the base visual so the fused weapon retains a clear identity
    if (this.wBase) this.wBase.draw(ctx);
    // Optionally draw a small orb/orientation indicating a fused modifier
    if (this.wMod) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.player.color || Fuse.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(this.player.x + Math.cos(this.angle) * (this.player.radius + 10), this.player.y + Math.sin(this.angle) * (this.player.radius + 10), 6 * this.wBase.getScale(), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  getCollisionPoints() {
    const pts = this._points; pts.length = 0;
    if (this.wBase) pts.push(...this.wBase.getCollisionPoints());
    return pts;
  }

  onHit(defender) {
    // Primary behavior first
    if (this.wBase && this.wBase.onHit) this.wBase.onHit(defender);
    // Apply secondary's special on-hit if it represents a status (reduced potency)
    if (this.wMod && this._modOnHit) {
      // Apply a weaker version of the modifier's onHit
      try {
        this._modOnHit(defender, /*weak=*/true);
      } catch (e) { /* swallow */ }
    }
  }

  onSuccessfulHit() {
    if (this.wBase && this.wBase.onSuccessfulHit) this.wBase.onSuccessfulHit();
    // small extra effect: if modifier grows on hit, apply scaled growth
    if (this.wMod && this._modOnSuccessfulHit) {
      try { this._modOnSuccessfulHit(/*weak=*/true); } catch (e) {}
    }
  }

  onStunEnd() {
    if (this.wBase && this.wBase.onStunEnd) this.wBase.onStunEnd();
  }

  canAttack(isPlayerStunned) {
    return this.wBase ? this.wBase.canAttack(isPlayerStunned) : false;
  }

  // Combine with a bias toward the "base" weapon
  getHitStunDurations() {
    if (this.wBase && typeof this.wBase.getHitStunDurations === 'function') return this.wBase.getHitStunDurations();
    return { attacker: 0, defender: 0 };
  }

  grantsImmunityOnHit() {
    return this.wBase ? (this.wBase.grantsImmunityOnHit && this.wBase.grantsImmunityOnHit()) : false;
  }

  shouldReverseOnHit() {
    return this.wBase ? (this.wBase.shouldReverseOnHit && this.wBase.shouldReverseOnHit()) : false;
  }

  playHitSound() {
    if (this.wBase && this.wBase.playHitSound) this.wBase.playHitSound();
  }

  getDamageDisplayText() {
    const baseLabel = this.pair[0]?.toUpperCase() || 'BASE';
    const modLabel = this.pair[1]?.toUpperCase() || 'MOD';
    const modNote = this._modDescriptor ? ` • ${this._modDescriptor}` : '';
    return `Fuse(${baseLabel}+${modLabel}) • Dmg: ${this.damage}${modNote}`;
  }

  // Propagate wall bounces to base only (modifier effects are passive)
  onWallBounce(axis) {
    if (this.wBase && this.wBase.onWallBounce) this.wBase.onWallBounce(axis);
  }

  // INTERNAL: derive modifier flags from wMod to apply light effects
  _applyModifierFlags() {
    this._modDamageBonus = 0;
    this._modDescriptor = '';
    this._modOnHit = null;
    this._modOnSuccessfulHit = null;

    if (!this.wMod) return;

    const modType = (this.pair[1] || '').toLowerCase();

    // Simple, safe mapping of modifier -> scaled effects
    if (modType === 'dagger') {
      // If the modifier is dagger, make base spin/attack speed slightly faster when base supports it
      this._modDamageBonus = 0.2;
      this._modDescriptor = 'fast';
      this._modOnSuccessfulHit = (weak) => {
        if (this.wBase && typeof this.wBase.spinSpeed === 'number') {
          // apply a mild bonus to spinSpeed (weaker when flagged weak)
          const amt = weak ? 0.8 : 1.6;
          this.wBase.spinSpeed = (this.wBase.spinSpeed || 0.1) + (0.06 * (amt));
        }
      };
    } else if (modType === 'scythe') {
      // Add a reduced poison applicator on hit (weaker than a full scythe)
      this._modDamageBonus = 0.1;
      this._modDescriptor = 'poison';
      this._modOnHit = (defender, weak) => {
        if (typeof defender.poisonStacks !== 'number') defender.poisonStacks = 0;
        defender.poisonStacks += (weak ? 1 : 1); // same stacks but overall ticking will be weaker by design
        defender.poisonFlashFrames = defender.poisonFlashMax || 10;
      };
    } else if (modType === 'spear') {
      // Add a small growth-on-hit scaling to base (weak fraction of spear)
      this._modDamageBonus = 0.25;
      this._modDescriptor = 'range+';
      this._modOnSuccessfulHit = (weak) => {
        if (this.wBase && typeof this.wBase.spearLength === 'number') {
          this.wBase.spearLength = (this.wBase.spearLength || 1) + (weak ? 0.02 : 0.12);
        }
      };
    } else if (modType === 'speedball' || modType === 'speedball') {
      this._modDamageBonus = 0.2;
      this._modDescriptor = 'zippy';
    } else if (modType === 'ak47') {
      // This modifier increases fire rate when fused onto a ranged base
      this._modDamageBonus = 0.2;
      this._modDescriptor = 'rapid';
      this._modOnSuccessfulHit = (weak) => {
        if (this.wBase && typeof this.wBase.fireRate === 'number') {
          this.wBase.fireRate = Math.min(20, (this.wBase.fireRate || 1) + (weak ? 1 : 3));
          this.wBase.shootInterval = Math.max(1, Math.floor(60 / this.wBase.fireRate));
        }
      };
    } else {
      // Generic small bonus
      this._modDamageBonus = 0.12;
      this._modDescriptor = 'blend';
    }
  }

  // INTERNAL: apply runtime modifiers each frame
  _applyFusionModifiers() {
    // small per-frame enforcement: ensure base properties exist and apply damage bonus
    this._modDamageBonus = this._modDamageBonus || 0;
    // re-run descriptor derivation if missing (safe)
    if (typeof this._modDescriptor === 'undefined' || this._modDescriptor === null) this._applyModifierFlags();
    // Apply a gentle, persistent effect if applicable (no heavy overrides)
    if (this.wBase && this._modDescriptor === 'rapid' && this.wBase.fireRate) {
      // Ensure shootInterval recalculated
      this.wBase.shootInterval = Math.max(1, Math.floor(60 / (this.wBase.fireRate || 1)));
    }
  }
}