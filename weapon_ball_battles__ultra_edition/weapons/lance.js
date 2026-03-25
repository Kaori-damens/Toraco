import { Spear } from './spear.js';

/*
 Lance (Joust) - a polearm specialized for a forward charging joust.
 Differences from Spear:
 - Higher base damage and reach.
 - On a successful hit the lancer performs a short forward charge impulse
   that knocks the defender back, applies a heavier stun and brief vulnerability,
   and gives the attacker a short recoil/slowdown after the joust.
 - The lance does not steadily "scale" like a spear; instead hits emphasize the joust effect.
*/

export class Lance extends Spear {
  static color = '#C0C0FF';
  static icon = 'lance_icon.png';

  constructor(player) {
    super(player);
    // Joust-tuned defaults
    this.spearLength = 1.8;
    this.damage = 1.8;       // stronger base hit
    this.spinSpeed = 0.05;   // pole-like feel
    this.joustImpulse = 18;  // speed applied to attacker briefly on hit (forward)
    this.recoilFriction = 0.85; // slows attacker after impulse
    this.joustStun = 80;     // defender stun frames (~1.3s)
    this.joustAttackerStun = 8; // small self-recovery stun to prevent instant repeat
  }

  // Override onHit to implement joust behaviour
  onHit(defender) {
    // Guard to avoid errors
    try {
      const ca = Math.cos(this.angle);
      const sa = Math.sin(this.angle);

      // Propel attacker forward along the lance facing direction to simulate a true joust.
      // Use addition so existing momentum is respected, but clamp to a sane maximum.
      const impulseX = ca * this.joustImpulse;
      const impulseY = sa * this.joustImpulse;
      if (this.player && typeof this.player.vx === 'number') {
        // Give a stronger, more decisive forward impulse
        this.player.vx += impulseX;
        this.player.vy += impulseY;

        // Clamp extreme speeds to avoid physics explosions
        const maxSpeed = 80;
        const sp = Math.hypot(this.player.vx, this.player.vy);
        if (sp > maxSpeed) {
          const f = maxSpeed / sp;
          this.player.vx *= f;
          this.player.vy *= f;
        }

        // Apply a short-lived recovery slowdown by reducing speed scalar slightly
        this.player.vx *= this.recoilFriction;
        this.player.vy *= this.recoilFriction;

        // Brief attacker invulnerability to simulate armour and momentum carry-through
        this.player.isImmune = true;
        this.player.immunityTimer = Math.max(this.player.immunityTimer || 0, 12);
      }

      // Knock defender away from attacker and apply heavy stun
      if (defender && typeof defender.vx === 'number') {
        const dx = defender.x - this.player.x;
        const dy = defender.y - this.player.y;
        const mag = Math.hypot(dx, dy) || 1;
        const kb = 28; // stronger knockback magnitude for joust
        defender.vx += (dx / mag) * kb;
        defender.vy += (dy / mag) * kb;

        if (typeof defender.stun === 'function') defender.stun(this.joustStun);
        defender.gainImmunityOnStunEnd = false;
        if (defender.say) defender.say('Thrusted!', 45);
      }

      // Attacker recovery: small self-stun to prevent immediate repeat and a tint for feedback
      if (this.player && typeof this.player.stun === 'function') this.player.stun(this.joustAttackerStun);
      this.tintColor = `rgba(200,220,255,0.6)`;
      this.damage = Math.max(this.damage, 1.8);
    } catch (e) {
      // Fail-safe logging
      console.warn('Lance.joust onHit error', e);
    }
  }

  // Give a concise display focused on joust stats
  getDamageDisplayText() {
    const dmg = (Math.round(this.damage * 10) / 10).toFixed(1);
    const range = (this.spearLength).toFixed(2);
    return `Joust • Dmg: ${dmg} • Reach: ${range}`;
  }

  // Optional: slightly different collision sampling to favor forward hits
  getCollisionPoints() {
    const points = this._points;
    points.length = 0;

    const s = this.getScale();
    const lanceLen = 140 * this.spearLength * s;
    const numPoints = Math.max(5, Math.floor(this.spearLength * 6));
    const collisionRadius = 11 * s;
    const baseOffset = this.player.radius + 6;
    const pointSpacing = (lanceLen - 20 * s) / (numPoints - 1);

    const ca = Math.cos(this.angle);
    const sa = Math.sin(this.angle);

    for (let i = 0; i < numPoints; i++) {
      const dist = baseOffset + (i * pointSpacing);
      // Bias points slightly forward to favor joust tip collisions
      points.push({
        x: this.player.x + dist * ca + ca * 4 * s,
        y: this.player.y + dist * sa + sa * 4 * s,
        radius: collisionRadius
      });
    }
    return points;
  }
}