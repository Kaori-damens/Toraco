// SpeedBall: no external weapon. The ball increases its speed every time it bounces off a wall.
// Speed increase is capped. Deals contact damage.
import { Weapon } from './base.js';
import { playHitHurtSound, playBoingSoundWithPitch, playLightningZapSound } from '../audio.js';
import { players } from '../state.js'; // Import players array for collision checks

export class SpeedBall extends Weapon {
  static color = '#FFD300'; // vibrant yellow
  static icon = 'speedball_icon.png';

  // NEW: Lightning bolt properties
  lightningBolts = [];
  lightningTriggerThreshold = 3.0; // Trigger lightning when speed multiplier is 3x or more
  lightningDamage = 10;
  lightningCooldown = 60; // 60 frames = 1 second cooldown between lightning strikes
  lightningArcDuration = 8; // How many frames each lightning arc lasts
  lightningBoltRadius = 15; // Radius for lightning bolt collision detection

  constructor(player) {
    super(player);
    this.damage = 1.0; // base contact damage
    this.currentSpeedMultiplier = 1.0;
    this.speedIncreasePerBounce = 0.08; // increase multiplier by 8% per bounce
    this.maxSpeedMultiplier = 100.0;    // cap at 100x base speed (e.g., 10 * 100 = 1000 px/frame)
    this.baseSpeed = player.speed || 10; // remember original player speed

    // Collision "aura" just outside the body to register contact hits
    this.contactPadding = 8;
    this.contactRadius = 10;

    this.lightningTimer = 0; // Initialize lightning timer
  }

  update(isPlayerStunned) {
    if (!isPlayerStunned) {
      // Apply the current speed multiplier to the player's speed
      this.player.speed = Math.min(this.baseSpeed * this.currentSpeedMultiplier, this.baseSpeed * this.maxSpeedMultiplier);

      // NEW: actively ramp actual velocity toward target speed so the ball visibly speeds up
      const targetSpeed = this.player.speed;
      const curVx = this.player.vx;
      const curVy = this.player.vy;
      const curSpeed = Math.hypot(curVx, curVy);
      if (targetSpeed > 0) {
        if (curSpeed < 0.001) {
          // If nearly stationary, nudge in current weapon facing direction
          const a = this.player.weapon ? this.player.weapon.angle : 0;
          this.player.vx = Math.cos(a) * (targetSpeed * 0.5);
          this.player.vy = Math.sin(a) * (targetSpeed * 0.5);
        } else {
          const lerp = 0.12; // gentle acceleration toward target
          const newSpeed = curSpeed + (targetSpeed - curSpeed) * lerp;
          const inv = 1 / curSpeed;
          this.player.vx = curVx * inv * newSpeed;
          this.player.vy = curVy * inv * newSpeed;
        }
      }

      // NEW: Lightning bolt logic
      this.lightningTimer--;
      if (this.currentSpeedMultiplier >= this.lightningTriggerThreshold && this.lightningTimer <= 0) {
        this.generateLightningBolt();
        this.lightningTimer = this.lightningCooldown;
      }
    }

    // Damage scales slightly with speed, capped at 2.0x
    this.damage = Math.max(1.0, Math.min(2.0, this.currentSpeedMultiplier));

    // NEW: Update active lightning bolts
    this.updateLightningBolts();
  }

  // SpeedBall-specific: increase speed on wall bounce
  onWallBounce(axis) {
    if (this.currentSpeedMultiplier < this.maxSpeedMultiplier) {
      this.currentSpeedMultiplier += this.speedIncreasePerBounce;
      this.currentSpeedMultiplier = Math.min(this.currentSpeedMultiplier, this.maxSpeedMultiplier);
    }
  }

  // NEW: Function to generate a lightning bolt
  generateLightningBolt() {
    if (!this.player.isAlive) return;

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    // Find a target (closest other alive player that is not self)
    let targetPlayer = null;
    let minDistSq = Infinity;
    players.forEach(p => {
      if (p !== this.player && p.isAlive) {
        const dx = p.x - this.player.x;
        const dy = p.y - this.player.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          targetPlayer = p;
        }
      }
    });

    const boltStart = { x: this.player.x, y: this.player.y };
    let boltEnd = { x: this.player.x, y: this.player.y };

    if (targetPlayer) {
      // Aim directly at the target
      boltEnd = { x: targetPlayer.x, y: targetPlayer.y };
    } else {
      // If no target, zap in a random direction away from the player
      const randomAngle = Math.random() * 2 * Math.PI;
      const zapDistance = 250 * this.getScale(); // How far the random zap goes, scaled
      boltEnd = {
        x: this.player.x + Math.cos(randomAngle) * zapDistance,
        y: this.player.y + Math.sin(randomAngle) * zapDistance
      };
      // Clamp to canvas bounds
      boltEnd.x = Math.max(0, Math.min(canvas.width, boltEnd.x));
      boltEnd.y = Math.max(0, Math.min(canvas.height, boltEnd.y));
    }

    // Offset start slightly from player center to avoid drawing inside the ball
    const dirX = boltEnd.x - boltStart.x;
    const dirY = boltEnd.y - boltStart.y;
    const dirMag = Math.hypot(dirX, dirY) || 1;
    const startOffset = this.player.radius + 5; // A little out of the player ball
    boltStart.x += (dirX / dirMag) * startOffset;
    boltStart.y += (dirY / dirMag) * startOffset;


    const bolt = {
      start: boltStart,
      end: boltEnd,
      life: this.lightningArcDuration,
      damage: this.lightningDamage,
      sourcePlayer: this.player, // Keep reference to source player
      collidedPlayers: new Set() // Store players already hit by this specific bolt
    };
    this.lightningBolts.push(bolt);

    // Play sound
    if (!this.isMenuContext) playLightningZapSound();
    // NEW: speech bubble
    if (this.player.say) this.player.say('Zap!', 30);
  }

  // NEW: Function to update and manage lightning bolts
  updateLightningBolts() {
    this.lightningBolts = this.lightningBolts.filter(bolt => {
      bolt.life--;

      // Collision detection for each bolt
      if (bolt.life > 0) {
        players.forEach(p => {
          // Do not hit self, dead players, or players already hit by THIS bolt
          if (p === bolt.sourcePlayer || !p.isAlive || bolt.collidedPlayers.has(p.id)) return;
          // NEW: prevent friendly fire in multi-player team modes
          if (players.length > 2 && bolt.sourcePlayer.team && p.team && bolt.sourcePlayer.team === p.team) return;

          // Simple line-circle collision check
          const lineStart = bolt.start;
          const lineEnd = bolt.end;
          const circle = { x: p.x, y: p.y, radius: p.radius };

          const LVx = lineEnd.x - lineStart.x;
          const LVy = lineEnd.y - lineStart.y;

          const CVx = circle.x - lineStart.x;
          const CVy = circle.y - lineStart.y;

          const dot = CVx * LVx + CVy * LVy;
          const lenSq = LVx * LVx + LVy * LVy;
          let t = -1;
          if (lenSq !== 0) {
            t = dot / lenSq;
          }

          let closestX, closestY;
          if (t < 0) {
            closestX = lineStart.x;
            closestY = lineStart.y;
          } else if (t > 1) {
            closestX = lineEnd.x;
            closestY = lineEnd.y;
          } else {
            closestX = lineStart.x + t * LVx;
            closestY = lineStart.y + t * LVy;
          }

          const distToCircleSq = (closestX - circle.x) * (closestX - circle.x) + (closestY - circle.y) * (closestY - circle.y);
          const effectiveRadius = circle.radius + this.lightningBoltRadius; // Add a buffer for visual hits

          if (distToCircleSq < effectiveRadius * effectiveRadius) {
            // Collision detected!
            p.health -= bolt.damage;
            bolt.collidedPlayers.add(p.id); // Mark player as hit by this bolt

            // Play hit sound and apply stun
            playHitHurtSound();
            p.stun(12); // Short stun (60 frames is 1 second, 12 frames is 0.2 seconds)

            // Handle player death if health falls to zero
            const DEATH_THRESHOLD = 0.5;
            if (p.health <= DEATH_THRESHOLD) {
                p.health = 0;
                if (p.isAlive) {
                    p.isAlive = false;
                    p.spawnFragments();
                }
            }
          }
        });
      }

      return bolt.life > 0;
    });
  }

  // No external visuals
  draw(ctx) {
    // NEW: Draw lightning bolts
    this.lightningBolts.forEach(bolt => {
      if (bolt.life <= 0) return;

      ctx.save();
      // Fade out
      ctx.globalAlpha = Math.max(0, bolt.life / this.lightningArcDuration);

      // Draw a jagged line for lightning
      ctx.strokeStyle = '#ADD8E6'; // Light blue
      ctx.lineWidth = 3 * this.getScale();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const startX = bolt.start.x;
      const startY = bolt.start.y;
      const endX = bolt.end.x;
      const endY = bolt.end.y;

      // Simple jaggedness
      const numSegments = 5;
      const segmentLengthX = (endX - startX) / numSegments;
      const segmentLengthY = (endY - startY) / numSegments;
      const randomness = 15 * this.getScale(); // How much to zig-zag

      ctx.moveTo(startX, startY);
      for (let i = 1; i < numSegments; i++) {
        const prevX = startX + (i - 1) * segmentLengthX;
        const prevY = startY + (i - 1) * segmentLengthY;
        const currentX = startX + i * segmentLengthX;
        const currentY = startY + i * segmentLengthY;

        // Perpendicular offset for zig-zag
        const normalX = -(currentY - prevY);
        const normalY = (currentX - prevX);
        const normalMag = Math.hypot(normalX, normalY) || 1;
        const offsetX = (normalX / normalMag) * (Math.random() - 0.5) * 2 * randomness;
        const offsetY = (normalY / normalMag) * (Math.random() - 0.5) * 2 * randomness;

        ctx.lineTo(currentX + offsetX, currentY + offsetY);
      }
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.restore();
    });
  }

  // Contact-based collision point around the body to allow contact damage
  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;
    if (!this.player.isAlive) return pts;
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
    const speed = (this.currentSpeedMultiplier * 100).toFixed(0);
    const dmg = (Math.round(this.damage * 10) / 10).toFixed(1);
    const lightningStatus = this.currentSpeedMultiplier >= this.lightningTriggerThreshold ? ' • Zapping!' : '';
    return `Speed: ${speed}% • Dmg: ${dmg}${lightningStatus}`;
  }

  canAttack() { return true; }
  getHitStunDurations() { return { attacker: 0, defender: 6 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
  playHitSound() { playHitHurtSound(); }
}