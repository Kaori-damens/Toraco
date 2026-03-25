// CustomWeapon: runtime-configurable weapon via UI definitions (persisted in localStorage)
import { Weapon } from './base.js';
import { playSwordHitSound, playHitHurtSound } from '../audio.js';

export class CustomWeapon extends Weapon {
  static color = '#999999';
  static icon = ''; // no icon; UI will show name

  constructor(player, def) {
    super(player);
    this.def = def || {};
    this.kind = (this.def.archetype || 'melee'); // 'melee' | 'projectile'
    this.damage = Number(this.def.damage || 1);
    this.color = this.def.color || '#999999';
    // NEW: optional AI image for drawing
    this._img = null;
    if (this.def.imageUrl) {
      this._img = new Image();
      this._img.src = this.def.imageUrl;
    }

    // Melee params
    this.bladeLength = Number(this.def.bladeLength || 100);
    this.spinSpeed = Number(this.def.spinSpeed || 0.1);
    this.reverseOnHitFlag = !!this.def.reverseOnHit;
    this.grantImmunity = !!this.def.grantsImmunity;
    this.stunA = Number(this.def.attackerStun || 6);
    this.stunD = Number(this.def.defenderStun || 6);

    // Projectile params
    this.projectiles = [];
    this.size = Number(this.def.projectileSize || 16);
    this.shotsPerSecond = Math.max(0.1, Number(this.def.shotsPerSecond || 1));
    this.baseSpeed = Number(this.def.projectileSpeed || 10);
    this.maxBounces = Math.max(0, Number(this.def.bounces || 0));
    this.lifeFrames = Math.max(10, Number(this.def.projectileLifetime || 120));
    this.shootTimer = 0;
    this.shootInterval = Math.max(1, Math.floor(60 / this.shotsPerSecond));

    // Tints
    this.tintColor = 'rgba(255,0,0,0)';
  }

  update(isPlayerStunned) {
    if (this.kind === 'melee') {
      if (!isPlayerStunned) {
        this.angle += this.spinSpeed * this.spinDirection;
      }
      // nothing else
    } else if (this.kind === 'projectile') {
      if (!isPlayerStunned) {
        this.angle += 0.04 * this.spinDirection;
        this.shootTimer--;
        if (this.shootTimer <= 0) {
          this.shootProjectile();
          this.shootTimer = this.shootInterval;
        }
      }
      this.updateProjectiles();
    }
  }

  shootProjectile() {
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);
    const startDist = this.player.radius + 20;
    const p = {
      x: this.player.x + ca * startDist,
      y: this.player.y + sa * startDist,
      vx: ca * this.baseSpeed,
      vy: sa * this.baseSpeed,
      life: this.lifeFrames,
      bouncesLeft: this.maxBounces,
      kind: 'custom_proj',
      parryCooldown: 0,
      radius: Math.max(6, this.size / 2),
      image: this._img || null,
      angle: this.angle
    };
    if (this.projectiles.length > 200) this.projectiles.shift();
    this.projectiles.push(p);
    if (!this.isMenuContext) playSwordHitSound();
  }

  updateProjectiles() {
    const canvas = document.getElementById('gameCanvas');
    this.projectiles = this.projectiles.filter(p => {
      p.x += p.vx; p.y += p.vy;
      p.life--;
      if (p.life <= 0) return false;
      if (canvas) {
        if (p.x <= 2 || p.x >= canvas.width - 2) {
          p.vx *= -1;
          p.bouncesLeft--;
        }
        if (p.y <= 2 || p.y >= canvas.height - 2) {
          p.vy *= -1;
          p.bouncesLeft--;
        }
      }
      if (p.bouncesLeft < 0) return false;
      return true;
    });
  }

  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;

    if (this.kind === 'melee') {
      const s = this.getScale();
      const length = Math.max(40, Math.min(200, this.bladeLength)) * s;
      const numPoints = 5;
      const r = 10 * s;
      const baseOffset = this.player.radius + 6;
      const step = (length - 20 * s) / (numPoints - 1);
      const ca = Math.cos(this.angle);
      const sa = Math.sin(this.angle);
      for (let i = 0; i < numPoints; i++) {
        const d = baseOffset + i * step;
        pts.push({ x: this.player.x + ca * d, y: this.player.y + sa * d, radius: r });
      }
    } else {
      // small bow-body sample to allow parries with others (optional)
      // projectiles
      this.projectiles.forEach(p => {
        pts.push({
          x: p.x, y: p.y, radius: Math.max(8, p.radius),
          type: 'custom-proj',
          projectileRef: p
        });
      });
    }
    return pts;
  }

  draw(ctx) {
    if (this.kind === 'melee') {
      if (this._img && this._img.complete && this._img.naturalWidth > 0) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.angle);
        const s = this.getScale();
        const size = Math.max(40, Math.min(120, this.bladeLength)) * 0.6 * s;
        const x = this.player.radius + Math.max(20, this.bladeLength * 0.5 * s);
        const y = -size / 2;
        ctx.drawImage(this._img, x, y, size, size);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.angle);
        const s = this.getScale();
        const length = Math.max(40, Math.min(200, this.bladeLength)) * s;
        const width = Math.max(6, 10 * s);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(this.player.radius, 0);
        ctx.lineTo(this.player.radius + length, 0);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // projectiles
      ctx.save();
      this.projectiles.forEach(p => {
        if (p.image && p.image.complete && p.image.naturalWidth > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.vy, p.vx));
          const s = this.getScale();
          const sz = Math.max(24, this.size) * s;
          ctx.drawImage(p.image, -sz/2, -sz/2, sz, sz);
          ctx.restore();
        } else {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(6, this.size / 2), 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }
  }

  onHit() {
    // minor tint feedback for melee
    if (this.kind === 'melee') {
      const a = Math.min(0.8, (this.damage || 1) * 0.1);
      this.tintColor = `rgba(255,0,0,${a})`;
    }
  }

  onSuccessfulHit() {
    if (this.reverseOnHitFlag) this.spinDirection *= -1;
  }

  canAttack(isPlayerStunned) { return !isPlayerStunned; }
  getHitStunDurations() { return { attacker: this.stunA || 6, defender: this.stunD || 6 }; }
  grantsImmunityOnHit() { return !!this.grantImmunity; }
  shouldReverseOnHit() { return !!this.reverseOnHitFlag; }
  playHitSound() { (this.kind === 'melee') ? playSwordHitSound() : playHitHurtSound(); }

  getDamageDisplayText() {
    if (this.kind === 'melee') {
      return `${this.def.name || 'Custom'} • Dmg: ${this.damage} • Len: ${Math.round(this.bladeLength)}`;
    }
    return `${this.def.name || 'Custom'} • Dmg: ${this.damage} • SPS: ${this.shotsPerSecond}`;
  }
}