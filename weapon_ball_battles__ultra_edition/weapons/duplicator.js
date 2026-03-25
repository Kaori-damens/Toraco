// Duplicator: no external weapon. The ball duplicates itself every time it bounces off a wall.
// Duplicates are smaller and have less health. Total duplicates capped.
import { Weapon } from './base.js';
import { playBoingSoundWithPitch, playHitHurtSound } from '../audio.js';
import { players, DEFAULT_ARENA_WIDTH, DEFAULT_ARENA_HEIGHT } from '../state.js';
import { Player } from '../player.js'; // Need to import Player to create new instances

export class Duplicator extends Weapon {
  static color = '#00BFFF'; // Deep sky blue
  static icon = 'duplicator_icon.png';
  static MAX_DUPLICATES = 100; // Increased from 30 to allow more clones

  constructor(player) {
    super(player);
    this.damage = 1.0; // Base contact damage
    this.baseSpeed = player.speed || 10;
    
    // Flag to prevent duplicating multiple times on a single "sticky" wall bounce
    this.lastBounceFrame = -1;

    // Minimum frames between duplications for this original (slows explosion of clones)
    this.minFramesBetweenDuplicates = 30;
  }

  update(isPlayerStunned) {
    // Duplicator doesn't have continuous effects, only reacts to wall bounces
  }

  // Duplicator-specific: create a new ball on wall bounce
  onWallBounce(axis) {
    // Throttle duplicates: require a short cooldown (frames) and some minimum impact speed
    const nowFrame = window.gameFrameNumber || 0;
    if (this.lastBounceFrame >= 0 && (nowFrame - this.lastBounceFrame) < this.minFramesBetweenDuplicates) return;
    this.lastBounceFrame = nowFrame;

    // IMPORTANT: Only the ORIGINAL duplicator (the one created from selection) can duplicate.
    // Clones (which are now 'basic' type) cannot. This was a previous user request.
    if (this.player.type !== 'duplicator') {
        return;
    }

    // Require a minimum impact speed to duplicate (avoids rapid spawns from tiny jitter bounces)
    const impactSpeed = Math.hypot(this.player.vx || 0, this.player.vy || 0);
    if (impactSpeed < 2.2) return;

    // Only count original duplicators and their marked clones, not every basic ball
    if (players.filter(p => p.type === 'duplicator' || p.isDuplicatorClone === true).length >= Duplicator.MAX_DUPLICATES) {
      return; // Cap reached, no more duplication (count both original duplicators and their basic clones)
    }

    // New ball properties: smaller radius, less health, but crucially, a 'basic' weapon type
    const newRadius = Math.max(15, this.player.radius * 0.7); // 70% of parent's radius, min 15
    const newHealth = Math.max(10, Math.floor(this.player.health * 0.45)); // ~45% of parent's health, min 10

    // Determine spawn position: slightly offset from parent, away from the wall it just hit
    let spawnX = this.player.x;
    let spawnY = this.player.y;
    let newVx = this.player.vx * 0.8; // New ball gets slightly reduced velocity
    let newVy = this.player.vy * 0.8;

    const offsetDistance = this.player.radius + newRadius + 5; // Spawn outside of current bounds
    const angle = Math.random() * Math.PI * 2; // Random angle for duplicate's velocity

    const arenaWidth = document.getElementById('gameCanvas').width || DEFAULT_ARENA_WIDTH;
    const arenaHeight = document.getElementById('gameCanvas').height || DEFAULT_ARENA_HEIGHT;

    // Adjust spawn position based on wall hit (push new ball away from wall)
    if (axis === 'x') {
      spawnX += this.player.vx > 0 ? -offsetDistance : offsetDistance;
      newVx = Math.cos(angle) * Math.hypot(this.player.vx, this.player.vy) * 0.8;
      newVy = Math.sin(angle) * Math.hypot(this.player.vx, this.player.vy) * 0.8;
    } else { // axis === 'y'
      spawnY += this.player.vy > 0 ? -offsetDistance : offsetDistance;
      newVx = Math.cos(angle) * Math.hypot(this.player.vx, this.player.vy) * 0.8;
      newVy = Math.sin(angle) * Math.hypot(this.player.vx, this.player.vy) * 0.8;
    }

    // Clamp spawn position to ensure it's within arena bounds
    spawnX = Math.max(newRadius, Math.min(arenaWidth - newRadius, spawnX));
    spawnY = Math.max(newRadius, Math.min(arenaHeight - newRadius, spawnY));


    const newPlayer = new Player(
      spawnX, spawnY,
      newRadius,
      this.player.color, // Keep parent's color
      newVx, newVy,
      'basic' // Cloned balls are always 'basic' and do not duplicate further or deal weapon damage
    );
    newPlayer.health = newHealth;
    newPlayer.team = this.player.team; // Keep parent's team if applicable
    // Mark as a duplicator clone so the cap and UI only count this family
    newPlayer.isDuplicatorClone = true;

    players.push(newPlayer);

    // Play a lighter boing sound for the duplication event (slightly louder for clarity)
    playBoingSoundWithPitch(1.3, 0.25); // Increased volume from 0.15
  }

  // No external visuals, the ball itself is the weapon
  draw(ctx) {}

  // Contact-based collision point around the body
  getCollisionPoints() {
    const pts = this._points;
    pts.length = 0;
    if (!this.player.isAlive) return pts;
    const r = this.player.radius + 8; // Small contact padding
    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);
    pts.push({
      x: this.player.x + ca * r,
      y: this.player.y + sa * r,
      radius: 10,
      type: 'body' // Important for collision system
    });
    return pts;
  }

  getDamageDisplayText() {
    // Count only the duplicator family: originals + marked clones
    const aliveDuplicators = players.filter(p => (p.type === 'duplicator' || p.isDuplicatorClone === true) && p.isAlive).length;
    return `Clones: ${aliveDuplicators}/${Duplicator.MAX_DUPLICATES}`;
  }

  canAttack() { return true; }
  getHitStunDurations() { return { attacker: 0, defender: 6 }; }
  grantsImmunityOnHit() { return false; }
  shouldReverseOnHit() { return false; }
  playHitSound() { playHitHurtSound(); }
}