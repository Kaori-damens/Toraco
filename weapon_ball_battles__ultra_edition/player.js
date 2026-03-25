import { NoWeapon, Sword, Dagger, Spear, Unarmed, Bow, Shuriken, Crusher, Grower, Shrinker } from './weapon.js';
import { Scythe } from './weapon.js';
import { Axe } from './weapon.js';
import { Staff } from './weapon.js'; // NEW: Staff
import { SpeedBall } from './weapon.js'; // NEW: SpeedBall
import { Duplicator, Lance } from './weapon.js'; // NEW: Duplicator + Lance
import { AK47 } from './weapon.js'; // NEW: AK-47
import { FireGod, GrassGod, WaterGod, AirGod, SoilGod } from './weapon.js'; // NEW: Elements
import { RocketLauncher, Hammer, Flamethrower, Slingshot, Rapier, Epee, SlimeGun, Tranquilizer, Lightsaber, WaterGun, LavaGun, Katana, Bomb, Bat, Mop, Paintbrush, Wand, Flail, Boomerang, Club } from './weapon.js';
import { DummyBall, TestBall } from './weapon.js'; // Dummy/Test for variants & boss
import { playSwordHitSound } from './audio.js';
import { playBoingSound } from './audio.js';
import { playBoingSoundWithPitch } from './audio.js';
import { CustomWeapon } from './weapon.js'; // NEW: CustomWeapon direct import
import { Fuse } from './weapon.js'; // NEW: Fuse
import { France, Italy, Germany } from './weapon.js'; // NEW: country weapons
import { VariantMulti } from './weapons/variant.js'; // NEW: variant wrapper

function parseColor(color) {
    // This is a simplified parser. For a robust solution, a library might be better.
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b };
}

export class Player {
    constructor(x, y, radius, color, vx, vy, type = 'basic') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.speed = 10;
        this.mass = this.radius * this.radius;
        
        // Initialize health before weapon setup, so dummyball can override to Infinity
        this.health = 100;
        
        // Defer weapon and color setup to setWeapon
        this.weapon = null;
        this.setWeapon(type, color);

        // Initialize other properties
        this.stunned = false;
        this.stunTimer = 0;
        this.isAlive = true;
        this.fragments = [];
        this.isImmune = false;
        this.immunityTimer = 0;
        this.onParryCooldown = false;
        this.parryCooldownTimer = 0;
        this.isVisuallyStunned = false;
        this.reverseWeaponOnStunEnd = false;
        this.gainImmunityOnStunEnd = false;
        this.gainParryCooldownOnStunEnd = false;
        this.stunEffectAlpha = 0;
        
        // NEW: Trail for unarmed players
        this.trail = [];
        this.maxTrailLength = 8;

        // NEW: Poison state (reworked scheduling)
        // The poison system deals 1 damage per "tick".
        // There is a fixed 5s cycle (poisonCycleFrames). With N stacks, there will be N ticks
        // evenly spaced within that 5s (so spacing = cycle/stacks). This ensures:
        // - Starts at 1 dmg every 5s
        // - Each new stack adds another 1 dmg within that same 5s window
        // - Cooldown between ticks decreases as stacks increase
        this.poisonStacks = 0;             // number of concurrent poison stacks
        this.poisonCycleFrames = 300;      // ~5s at 60fps
        this.poisonElapsedFrames = 0;      // accumulates time since last poison tick

        // NEW: Purple flash when poison ticks
        this.poisonFlashFrames = 0;     
        this.poisonFlashMax = 12;       
        
        // NEW: squash/stretch animation state
        this.squashX = 1;
        this.squashY = 1;
        this.squashDamping = 0.18; // how quickly it returns to 1

        // NEW: delayed crusher kill to show a squish animation
        this.crushPendingFrames = 0;

        // NEW: boing cooldown to avoid spammy sound on repeated micro-bounces
        this.boingCooldown = 0;

        // NEW: Bleed (Axe) state
        this.axeBleedFrames = 0;       // remaining frames of bleed
        this.axeBleedInterval = 15;    // frames per 1 damage tick
        this.axeBleedCounter = 0;      // frame counter for tick cadence
        this.bleedFlashFrames = 0;
        this.bleedFlashMax = 10;
        // NEW: speech bubble
        this.speechText = '';
        this.speechFrames = 0;
        // NEW: dizzy effect (Germany beer)
        this.dizzyFrames = 0;
        this.dizzyStrength = 0;
    }

    setWeapon(type, color = 'white') {
        this.type = type;
        // NEW: parse variants: _dual, _super, _mega, _quadruple
        const variantMatch = typeof type === 'string' && type.match(/^(.+?)_(dual|super|mega|quadruple)$/);
        if (variantMatch) {
            const VARS = { dual: {count:2,power:1.1}, super:{count:1,power:1.5}, mega:{count:1,power:2.0}, quadruple:{count:4,power:1.2} };
            const REG = {
                sword:Sword, dagger:Dagger, spear:Spear, unarmed:Unarmed, bow:Bow,
                shuriken:Shuriken, crusher:Crusher, grower:Grower, shrinker:Shrinker,
                axe:Axe, scythe:Scythe, staff:Staff, speedball:SpeedBall, testball:TestBall,
                ak47:AK47, fuse:Fuse, france:France, italy:Italy, germany:Germany,
                rapier:Rapier, epee:Epee, katana:Katana, lightsaber:Lightsaber,
                hammer:Hammer, bat:Bat, lance:Lance
            };
            const baseType = variantMatch[1]; const vKey = variantMatch[2];
            const BaseCls = REG[baseType] || null;
            const cfg = VARS[vKey];
            this.weapon = new VariantMulti(this, BaseCls, cfg.count, cfg.power);
            // color from base if known
            const baseColor = (REG[baseType] && REG[baseType].color) ? REG[baseType].color : color;
            this.color = baseColor;
            this.originalColor = baseColor;
            this.originalColorRgb = parseColor(baseColor);
            return;
        }
        switch(type) {
            case 'sword':
                this.weapon = new Sword(this);
                this.color = Sword.color;
                break;
            case 'dagger':
                this.weapon = new Dagger(this);
                this.color = Dagger.color;
                break;
            case 'rapier':
                this.weapon = new Rapier(this);
                this.color = Rapier.color;
                break;
            case 'epee':
                this.weapon = new Epee(this);
                this.color = Epee.color;
                break;
            case 'katana':
                this.weapon = new Katana(this);
                this.color = Katana.color;
                break;
            case 'spear':
                this.weapon = new Spear(this);
                this.color = Spear.color;
                break;
            case 'unarmed':
                this.weapon = new Unarmed(this);
                this.color = Unarmed.color;
                break;
            case 'bow':
                this.weapon = new Bow(this);
                this.color = Bow.color;
                break;
            case 'slingshot':
                this.weapon = new Slingshot(this);
                this.color = Slingshot.color;
                break;
            case 'shuriken':
                this.weapon = new Shuriken(this);
                this.color = Shuriken.color;
                break;
            case 'crusher':
                this.weapon = new Crusher(this);
                this.color = Crusher.color;
                break;
            case 'grower':
                this.weapon = new Grower(this);
                this.color = Grower.color;
                break;
            case 'shrinker':
                this.weapon = new Shrinker(this);
                this.color = Shrinker.color;
                break;
            case 'axe':
                this.weapon = new Axe(this);
                this.color = Axe.color;
                break;
            case 'hammer':
                this.weapon = new Hammer(this);
                this.color = Hammer.color;
                break;
            case 'bat':
                this.weapon = new Bat(this);
                this.color = Bat.color;
                break;
            case 'mop':
                this.weapon = new Mop(this);
                this.color = Mop.color;
                break;
            case 'scythe':
                this.weapon = new Scythe(this);
                this.color = Scythe.color;
                break;
            case 'staff':
                this.weapon = new Staff(this);
                this.color = Staff.color;
                break;
            case 'wand':
                this.weapon = new Wand(this);
                this.color = Wand.color;
                break;
            case 'speedball':
                this.weapon = new SpeedBall(this);
                this.color = SpeedBall.color;
                break;
            case 'duplicator': // NEW: Duplicator
                this.weapon = new Duplicator(this);
                this.color = Duplicator.color;
                break;
            case 'lance':
                this.weapon = new Lance(this);
                this.color = Lance.color;
                break;
            case 'ak47': // NEW: AK-47
                this.weapon = new AK47(this);
                this.color = AK47.color;
                break;
            case 'rocket':
                this.weapon = new RocketLauncher(this);
                this.color = RocketLauncher.color;
                break;
            case 'flamethrower':
                this.weapon = new Flamethrower(this);
                this.color = Flamethrower.color;
                break;
            case 'slimegun':
                this.weapon = new SlimeGun(this);
                this.color = SlimeGun.color;
                break;
            case 'tranquilizer':
                this.weapon = new Tranquilizer(this);
                this.color = Tranquilizer.color;
                break;
            case 'lightsaber':
                this.weapon = new Lightsaber(this);
                this.color = Lightsaber.color;
                break;
            case 'watergun':
                this.weapon = new WaterGun(this);
                this.color = WaterGun.color;
                break;
            case 'lavagun':
                this.weapon = new LavaGun(this);
                this.color = LavaGun.color;
                break;
            case 'bomb':
                this.weapon = new Bomb(this);
                this.color = Bomb.color;
                break;
            case 'paintbrush':
                this.weapon = new Paintbrush(this);
                this.color = Paintbrush.color;
                break;
            case 'fuse': // NEW: Fusion weapon (default Sword+Bow)
                this.weapon = new Fuse(this, 'sword', 'bow');
                this.color = Fuse.color;
                break;
            case 'france':
                this.weapon = new France(this);
                this.color = France.color;
                break;
            case 'italy':
                this.weapon = new Italy(this);
                this.color = Italy.color;
                break;
            case 'germany':
                this.weapon = new Germany(this);
                this.color = Germany.color;
                break;
            case 'fire_god':
                this.weapon = new FireGod(this);
                this.color = FireGod.color;
                break;
            case 'grass_god':
                this.weapon = new GrassGod(this);
                this.color = GrassGod.color;
                break;
            case 'water_god':
                this.weapon = new WaterGod(this);
                this.color = WaterGod.color;
                break;
            case 'air_god':
                this.weapon = new AirGod(this);
                this.color = AirGod.color;
                break;
            case 'soil_god':
                this.weapon = new SoilGod(this);
                this.color = SoilGod.color;
                break;
            default:
                // NEW: Support custom weapons: type format "custom:MyName"
                if (typeof type === 'string' && type.startsWith('custom:')) {
                    const defName = type.slice(7);
                    const reg = (window.customWeaponRegistry && window.customWeaponRegistry[defName]) || null;
                    this.weapon = new CustomWeapon(this, reg || { name: defName, archetype: 'melee', color: '#999' });
                    this.color = (reg && reg.color) ? reg.color : '#999';
                } else if (typeof type === 'string' && type.startsWith('fuse:')) {
                    // NEW: Parse fuse types "fuse:weaponA+weaponB"
                    const combo = type.slice(5);
                    const [wa, wb] = combo.split('+').map(s => (s || '').trim().toLowerCase());
                    const a = wa || 'sword';
                    const b = wb || 'bow';
                    this.weapon = new Fuse(this, a, b);
                    this.color = Fuse.color;
                } else {
                    this.weapon = new NoWeapon(this);
                    this.color = color;
                }
                break;
        }
        this.originalColor = this.color;
        this.originalColorRgb = parseColor(this.color);
    }
    
    reset(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.health = 100;
        this.stunned = false;
        this.stunTimer = 0;
        this.isAlive = true;
        this.fragments = [];
        this.isImmune = false;
        this.immunityTimer = 0;
        this.onParryCooldown = false;
        this.parryCooldownTimer = 0;
        this.isVisuallyStunned = false;
        this.stunEffectAlpha = 0;
        this.reverseWeaponOnStunEnd = false;
        this.gainImmunityOnStunEnd = false;
        this.gainParryCooldownOnStunEnd = false;

        // Reset poison state (reworked)
        this.poisonStacks = 0;
        this.poisonCycleFrames = 300;
        this.poisonElapsedFrames = 0;
        this.poisonFlashFrames = 0;

        // Reset bleed state
        this.axeBleedFrames = 0;
        this.axeBleedCounter = 0;
        this.bleedFlashFrames = 0;
    }

    draw(ctx) {
        if (this.isAlive) {
            // NEW: Draw trail for unarmed players
            if (this.type === 'unarmed' && this.trail.length > 1) {
                ctx.save();
                for (let i = 0; i < this.trail.length - 1; i++) {
                    const alpha = (i + 1) / this.trail.length * 0.5; // Fade from 0 to 0.5
                    const trailRadius = this.radius * (0.3 + (i / this.trail.length) * 0.7); // Start small, grow to full size
                    
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(this.trail[i].x, this.trail[i].y, trailRadius, 0, Math.PI * 2);
                    ctx.fillStyle = this.originalColor;
                    ctx.fill();
                    ctx.closePath();
                }
                ctx.restore();
            }
            
            // NEW: use squash/stretch transform for the body
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.squashX, this.squashY);

            // This will now only draw the player body and health
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            
            // Compute base color first
            const { r, g, b } = this.originalColorRgb;
            let blendedR = r, blendedG = g, blendedB = b;

            // White flash for stun
            if (this.isVisuallyStunned) {
                blendedR = Math.round(r * (1 - this.stunEffectAlpha) + 255 * this.stunEffectAlpha);
                blendedG = Math.round(g * (1 - this.stunEffectAlpha) + 255 * this.stunEffectAlpha);
                blendedB = Math.round(b * (1 - this.stunEffectAlpha) + 255 * this.stunEffectAlpha);
            }

            // NEW: Purple flash for poison ticks (overrides stun flash if active)
            if (this.poisonFlashFrames > 0) {
                const t = Math.min(1, this.poisonFlashFrames / this.poisonFlashMax);
                const pr = 170, pg = 63, pb = 255; // #AA3FFF
                blendedR = Math.round(blendedR * (1 - t) + pr * t);
                blendedG = Math.round(blendedG * (1 - t) + pg * t);
                blendedB = Math.round(blendedB * (1 - t) + pb * t);
            }

            // NEW: Red flash for bleed ticks
            if (this.bleedFlashFrames > 0) {
                const t2 = Math.min(1, this.bleedFlashFrames / this.bleedFlashMax);
                const rr = 220, rg = 40, rb = 40; // bright red tint
                blendedR = Math.round(blendedR * (1 - t2) + rr * t2);
                blendedG = Math.round(blendedG * (1 - t2) + rg * t2);
                blendedB = Math.round(blendedB * (1 - t2) + rb * t2);
            }

            ctx.fillStyle = `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
            
            // NEW: Thick outline ONLY for the actual Boss (not all red team members).
            const outlineWidth = this.isBoss
                ? Math.max(5, Math.round(this.radius * 0.06))
                : 2;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = outlineWidth;

            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore(); // end squash transform

            // Draw health - SCALE with radius for large bosses (unscaled so it stays crisp)
            const computed = Math.round(this.radius * 1.1);
            const healthFontSize = (this.team === 'red')
                ? Math.max(28, Math.min(110, computed))
                : Math.max(24, Math.min(72, computed));
            ctx.font = `${healthFontSize}px Anton, sans-serif`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(this.health), this.x, this.y + 6);

            // WIN animation: glowing pulsing ring + confetti
            if (this.isWinning && this.winFrames > 0) {
                const t = (this.winTick || 0) / Math.max(1, this.winFrames);
                const ringR = this.radius + 8 + Math.sin(t * Math.PI * 3) * (6 + this.radius * 0.25);
                ctx.save();
                ctx.globalAlpha = 0.9 * (1 - t * 0.55);
                ctx.strokeStyle = `rgba(255, 235, 59, ${0.9 - t * 0.7})`; // warm gold
                ctx.lineWidth = Math.max(3, 6 * (1 - t));
                ctx.beginPath();
                ctx.arc(this.x, this.y, ringR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // Confetti drawing
                if (Array.isArray(this.winConfetti)) {
                    ctx.save();
                    this.winConfetti.forEach(c => {
                        if (c.life > 0) {
                            ctx.globalAlpha = Math.max(0, c.alpha * (c.life / 100));
                            ctx.fillStyle = c.color;
                            ctx.fillRect(c.x - c.size / 2, c.y - c.size / 2, c.size, c.size);
                        }
                    });
                    ctx.restore();
                }

                // advance win tick / confetti simulation
                this.winTick = (this.winTick || 0) + 1;
                if (this.winConfetti) {
                    this.winConfetti.forEach(c => {
                        c.x += c.vx;
                        c.y += c.vy;
                        c.vy += 0.08; // gravity on confetti
                        c.life--;
                        c.alpha = Math.max(0, c.life / 80);
                    });
                }
                this.winFrames--;
                if (this.winFrames <= 0) {
                    this.isWinning = false;
                    this.winConfetti = [];
                }
            }

            // NEW: draw speech bubble
            if (this.speechFrames > 0 && this.speechText) {
                ctx.save();
                const pad = 8, tail = 6;
                ctx.font = `16px Anton, sans-serif`;
                const text = this.speechText;
                const w = Math.min(220, Math.max(28, ctx.measureText(text).width + pad * 2));
                const h = 26;
                const bx = this.x - w / 2, by = this.y - this.radius - h - 12;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(bx, by, w, h, 6);
                ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(this.x - 6, by + h);
                ctx.lineTo(this.x, by + h + tail);
                ctx.lineTo(this.x + 6, by + h);
                ctx.closePath();
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, this.x, by + h / 2 + 1);
                ctx.restore();
            }
        } else {
            // Draw fragments if player is not alive
            // Remove fragments that have fully faded out
            this.fragments = this.fragments.filter(fragment => fragment.alpha > 0);

            this.fragments.forEach(fragment => {
                ctx.beginPath();
                ctx.arc(fragment.x, fragment.y, fragment.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${fragment.r}, ${fragment.g}, ${fragment.b}, ${fragment.alpha})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(0, 0, 0, ${fragment.alpha})`; // Black outline, also fades
                ctx.lineWidth = 1; // Thin outline
                ctx.stroke();
                ctx.closePath();
            });
        }
    }

    drawWeapon(ctx) {
        if (!this.isAlive) return;
        this.weapon.draw(ctx);
    }

    stun(duration) {
        this.stunned = true;
        this.stunTimer = duration;
        this.isVisuallyStunned = true;
        this.stunEffectAlpha = 1; // Instant full white flash
    }

    update(width, height, isMenuContext = false, gravityOn = true) {
        if (this.isAlive) {
            // NEW: handle delayed crusher kill with visible squish
            if (this.crushPendingFrames > 0) {
                this.crushPendingFrames--;
                // Freeze motion while being crushed
                this.vx = 0;
                this.vy = 0;
                // Extra strong squash while pending
                // Slowly relax toward a very squashed look
                const targetX = (this._crushAxis === 'x') ? 0.35 : 1.6;
                const targetY = (this._crushAxis === 'y') ? 0.35 : 1.6;
                this.squashX += (targetX - this.squashX) * 0.25;
                this.squashY += (targetY - this.squashY) * 0.25;

                if (this.crushPendingFrames === 0) {
                    // Finalize death
                    this.health = 0;
                    this.isAlive = false;
                    this.spawnFragments();
                    // Reset axis marker
                    this._crushAxis = null;
                    return;
                }
            }

            // Check for death early
            const DEATH_THRESHOLD = 0.5;
            if (this.health <= DEATH_THRESHOLD) {
                this.health = 0;
                this.isAlive = false;
                this.spawnFragments();
                return;
            }

            // NEW: Reworked poison ticking scheme
            if (this.poisonStacks > 0) {
                // Determine per-tick spacing based on current stacks (always at least a short gap)
                const spacing = Math.max(6, Math.floor(this.poisonCycleFrames / this.poisonStacks));
                this.poisonElapsedFrames++;

                // Only ever tick once per frame; if elapsed surpasses spacing, consume exactly one tick
                if (this.poisonElapsedFrames >= spacing) {
                    this.poisonElapsedFrames -= spacing; // keep residual to maintain even spacing

                    // Apply 1 poison damage per tick
                    this.health -= 1;

                    // Trigger purple flash for visual feedback
                    this.poisonFlashFrames = this.poisonFlashMax;
                }
            }

            // Decay poison flash
            if (this.poisonFlashFrames > 0) this.poisonFlashFrames--;

            // NEW: Axe bleed ticking
            if (this.axeBleedFrames > 0) {
                this.axeBleedFrames--;
                this.axeBleedCounter++;
                const interval = Math.max(3, this.axeBleedInterval | 0);
                if (this.axeBleedCounter >= interval) {
                    this.axeBleedCounter = 0;
                    this.health -= 1; // 1 damage per tick
                    this.bleedFlashFrames = this.bleedFlashMax;
                }
            }
            if (this.bleedFlashFrames > 0) this.bleedFlashFrames--;

            // NEW: dizzy wobble
            if (this.dizzyFrames > 0) {
                this.dizzyFrames--;
                const ang = (Math.random() - 0.5) * this.dizzyStrength;
                const cs = Math.cos(ang), sn = Math.sin(ang);
                const vx = this.vx * cs - this.vy * sn;
                const vy = this.vx * sn + this.vy * cs;
                this.vx = vx; this.vy = vy;
            }

            // Propagate context
            if (this.weapon) {
                this.weapon.isMenuContext = !!isMenuContext;
                // NEW: Pass current frame number to weapon for internal cooldowns/flags (e.g., Duplicator)
                this.weapon.gameFrameNumber = window.gameFrameNumber;
            }

            // NEW: Update trail for unarmed players
            if (this.type === 'unarmed') {
                this.trail.push({ x: this.x, y: this.y });
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
            }

            // Ease squash back toward normal each frame
            this.squashX += (1 - this.squashX) * this.squashDamping;
            this.squashY += (1 - this.squashY) * this.squashDamping;

            // Handle stun timer FIRST
            if (this.stunned) {
                this.stunTimer--;
                
                // Smooth transition for stun effect (NEW)
                if (this.isVisuallyStunned) {
                    this.stunEffectAlpha = Math.max(0, this.stunEffectAlpha - 0.15); // Fast fade from white
                }
                
                if (this.stunTimer <= 0) {
                    this.stunned = false;
                    this.isVisuallyStunned = false; // Reset visual stun state when actual stun ends
                    this.stunEffectAlpha = 0; // Ensure return to original color
                    
                    this.weapon.onStunEnd();
                    
                    // Reverse weapon spin direction when stun ends, only if flag is set
                    if (this.reverseWeaponOnStunEnd) {
                        this.weapon.spinDirection *= -1;
                    }
                    this.reverseWeaponOnStunEnd = false; // Reset the flag
                    
                    // Set immunity after stun ends for a short duration, if flagged to do so
                    if (this.gainImmunityOnStunEnd) {
                        this.isImmune = true;
                        this.immunityTimer = 15; // Immunity for 15 frames (0.25s)
                        this.gainImmunityOnStunEnd = false; // Reset the flag
                    }

                    // Set parry cooldown after stun ends, if flagged
                    if (this.gainParryCooldownOnStunEnd) {
                        this.onParryCooldown = true;
                        this.parryCooldownTimer = 10; // Parry cooldown for 10 frames (~0.16s)
                        this.gainParryCooldownOnStunEnd = false; // Reset the flag
                    }
                }
            }

            // Handle immunity timer (runs regardless of stun state)
            if (this.isImmune) {
                this.immunityTimer--;
                if (this.immunityTimer <= 0) {
                    this.isImmune = false;
                }
            }

            // Handle parry cooldown timer
            if (this.onParryCooldown) {
                this.parryCooldownTimer--;
                if (this.parryCooldownTimer <= 0) {
                    this.onParryCooldown = false;
                }
            }

            // Tick boing cooldown
            if (this.boingCooldown > 0) this.boingCooldown--;

            // NEW: countdown speech bubble
            if (this.speechFrames > 0) this.speechFrames--;

            // Delegate weapon update
            this.weapon.update(this.stunned);

            // Only move/apply physics if NOT stunned
            if (!this.stunned) {
                // Gravity handling:
                // - isMenuContext: no gravity (0)
                // - game context: default 0.15 when gravityOn is true
                let gravity = 0;
                if (!isMenuContext && gravityOn) {
                    // CHANGE: Unarmed now uses the same gravity as other balls
                    gravity = 0.15;
                }

                // Add speed-based pitch helper (higher speed => higher pitch, never below 1.0)
                const pitchFromSpeed = (speed) => {
                    const s = Math.max(0, speed);
                    let rate = 1 + Math.min(2.5, s / 8) * 0.8; // gentle curve up
                    // Extra pitch for SpeedBall at 5000%+ (multiplier >= 50)
                    if (this.type === 'speedball') {
                        const mult = (this.weapon && this.weapon.currentSpeedMultiplier) || 1;
                        if (mult >= 50) rate = Math.min(4.5, rate + 0.8); // raise cap and add boost
                    }
                    return Math.max(1, Math.min(4.5, rate)); // clamp between 1x and 4.5x
                };

                // NEW: Fall Straight mode — when gravity is ON, horizontal velocity is suppressed
                if (window.fallStraightMode && gravityOn) {
                    this.vx = 0;
                }

                // NEW: Horizontal movement toggle — if disabled, suppress horizontal velocity
                if (window.horizontalEnabled === false) {
                    this.vx = 0;
                }

                // Move player horizontally
                this.x += this.vx;
                
                // Apply gravity and move player vertically
                this.vy += gravity;
                this.y += this.vy;

                // Wall collision detection
                if (this.x + this.radius > width) {
                    // Determine squash by pre-impact horizontal speed
                    const preSpeed = Math.abs(this.vx);
                    const amount = (function(speed) {
                        const min = 0.55, max = 0.95;
                        const s = Math.max(0, Math.min(22, speed));
                        const t = Math.sqrt(s / 22);
                        return max - t * (max - min);
                    })(preSpeed);
                    this.triggerSquash('x', amount);

                    this.vx *= -1;
                    this.x = width - this.radius;
                    if (!isMenuContext && this.boingCooldown <= 0 && preSpeed > 2) {
                        if (this.type === 'grower' || this.type === 'shrinker' || this.type === 'crusher') {
                            const baseR = 35, r = Math.max(2, this.radius);
                            const rate = (this.type === 'grower' || this.type === 'crusher')
                                ? Math.max(0.6, Math.min(1.2, baseR / r))
                                : Math.max(1.0, Math.min(2.4, (baseR / r) * 1.2));
                            playBoingSoundWithPitch(rate, 0.22);
                        } else {
                            playBoingSound();
                        }
                        this.boingCooldown = 6;
                    }
                    if (this.weapon && typeof this.weapon.onWallBounce === 'function') {
                        this.weapon.onWallBounce('x');
                    }
                } else if (this.x - this.radius < 0) {
                    // Determine squash by pre-impact horizontal speed
                    const preSpeed = Math.abs(this.vx);
                    const amount = (function(speed) {
                        const min = 0.55, max = 0.95;
                        const s = Math.max(0, Math.min(22, speed));
                        const t = Math.sqrt(s / 22);
                        return max - t * (max - min);
                    })(preSpeed);
                    this.triggerSquash('x', amount);

                    this.vx *= -1;
                    this.x = this.radius;
                    if (!isMenuContext && this.boingCooldown <= 0 && preSpeed > 2) {
                        if (this.type === 'grower' || this.type === 'shrinker' || this.type === 'crusher') {
                            const baseR = 35, r = Math.max(2, this.radius);
                            const rate = (this.type === 'grower' || this.type === 'crusher')
                                ? Math.max(0.6, Math.min(1.2, baseR / r))
                                : Math.max(1.0, Math.min(2.4, (baseR / r) * 1.2));
                            playBoingSoundWithPitch(rate, 0.22);
                        } else {
                            playBoingSound();
                        }
                        this.boingCooldown = 6;
                    }
                    if (this.weapon && typeof this.weapon.onWallBounce === 'function') {
                        this.weapon.onWallBounce('x');
                    }
                }

                if (this.y + this.radius > height) {
                    // Determine squash by pre-impact vertical speed
                    const preSpeed = Math.abs(this.vy);
                    const amount = (function(speed) {
                        const min = 0.55, max = 0.95;
                        const s = Math.max(0, Math.min(22, speed));
                        const t = Math.sqrt(s / 22);
                        return max - t * (max - min);
                    })(preSpeed);
                    this.triggerSquash('y', amount);

                    this.vy *= -1; // Perfectly elastic bounce
                    this.y = height - this.radius;
                    if (!isMenuContext && this.boingCooldown <= 0 && preSpeed > 2) {
                        if (this.type === 'grower' || this.type === 'shrinker' || this.type === 'crusher') {
                            const baseR = 35, r = Math.max(2, this.radius);
                            const rate = (this.type === 'grower' || this.type === 'crusher')
                                ? Math.max(0.6, Math.min(1.2, baseR / r))
                                : Math.max(1.0, Math.min(2.4, (baseR / r) * 1.2));
                            playBoingSoundWithPitch(rate, 0.22);
                        } else {
                            playBoingSound();
                        }
                        this.boingCooldown = 6;
                    }
                    if (this.weapon && typeof this.weapon.onWallBounce === 'function') {
                        this.weapon.onWallBounce('y');
                    }
                    
                    // Stop small vertical movement to prevent endless jittering on floor
                    if (Math.abs(this.vy) < 1) { 
                        this.vy = 0;
                    }
                } else if (this.y - this.radius < 0) {
                    // Determine squash by pre-impact vertical speed
                    const preSpeed = Math.abs(this.vy);
                    const amount = (function(speed) {
                        const min = 0.55, max = 0.95;
                        const s = Math.max(0, Math.min(22, speed));
                        const t = Math.sqrt(s / 22);
                        return max - t * (max - min);
                    })(preSpeed);
                    this.triggerSquash('y', amount);

                    this.vy *= -1; // Perfectly elastic bounce
                    this.y = this.radius;
                    if (!isMenuContext && this.boingCooldown <= 0 && preSpeed > 2) {
                        if (this.type === 'grower' || this.type === 'shrinker' || this.type === 'crusher') {
                            const baseR = 35, r = Math.max(2, this.radius);
                            const rate = (this.type === 'grower' || this.type === 'crusher')
                                ? Math.max(0.6, Math.min(1.2, baseR / r))
                                : Math.max(1.0, Math.min(2.4, (baseR / r) * 1.2));
                            playBoingSoundWithPitch(rate, 0.22);
                        } else {
                            playBoingSound();
                        }
                        this.boingCooldown = 6;
                    }
                    if (this.weapon && typeof this.weapon.onWallBounce === 'function') {
                        this.weapon.onWallBounce('y');
                    }
                }
            }
        } else {
            // Update fragments if player is not alive
            // Remove fragments that have fully faded out
            this.fragments = this.fragments.filter(fragment => fragment.alpha > 0);

            this.fragments.forEach(fragment => {
                // Gravity for fragments is also 0 in menu context
                const gravity = (!isMenuContext && gravityOn) ? 0.15 : 0; 
                const bounceDamping = 0.8; // Fragments bounce less
                const friction = 0.99; // Horizontal friction for fragments

                fragment.vy += gravity;
                fragment.x += fragment.vx;
                fragment.y += fragment.vy;
                
                // Apply some friction to slow down horizontal movement
                fragment.vx *= friction;

                // Wall collision for fragments
                if (fragment.x + fragment.radius > width) {
                    fragment.vx *= -bounceDamping;
                    fragment.x = width - fragment.radius;
                } else if (fragment.x - fragment.radius < 0) {
                    fragment.vx *= -bounceDamping;
                    fragment.x = fragment.radius;
                }

                if (fragment.y + fragment.radius > height) {
                    fragment.vy *= -bounceDamping;
                    fragment.y = height - fragment.radius;
                    // Stop small vertical movement to prevent endless jittering on floor
                    if (Math.abs(fragment.vy) < 1) { 
                        fragment.vy = 0;
                    }
                } else if (fragment.y - fragment.radius < 0) {
                    fragment.vy *= -bounceDamping;
                    fragment.y = fragment.radius;
                }

                // Fade out fragments over time
                fragment.alpha -= 0.01; // Fades out over 100 frames (approx 1.6 seconds at 60fps)
            });
        }
    }

    // NEW: public helper to trigger a squash/stretch event
    triggerSquash(axis = 'y', amount = 0.75) {
        // amount < 1 squashes along that axis; conserve volume by stretching the other axis
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const sq = clamp(amount, 0.35, 0.95);
        const inv = clamp(1 / sq, 1.05, 2.2);

        if (axis === 'x') {
            this.squashX = sq;
            this.squashY = inv;
        } else {
            this.squashY = sq;
            this.squashX = inv;
        }
    }
    
    // NEW: mark this player to be crushed after a short squish animation
    startCrushKill(axis = 'x', frames = 10) {
        // Protect Dummy Ball from instant kills
        if (this.type === 'dummyball' || !isFinite(this.health)) return;
        
        this._crushAxis = axis;
        this.crushPendingFrames = Math.max(4, Math.min(24, frames));
        // Immediate strong squash to make it obvious
        this.triggerSquash(axis, 0.45);
    }

    // Returns an array of collision points (circles) along the sword's length
    getWeaponCollisionPoints() {
        if (!this.isAlive) return [];
        return this.weapon.getCollisionPoints();
    }

    // Method to spawn small circles when the player dies (enhanced with death animation trigger)
    spawnFragments() {
        // Begin a short death animation window so UI can show an effect before or while fragments fly
        this.deathAnimFrames = Math.max(48, Math.floor((this.radius / 35) * 60)); // scale by size (0.8s base)
        this.deathAnimProgress = 0;

        this.fragments = []; // Clear any existing fragments
        const numFragments = Math.floor(Math.random() * 6) + 6; // 6 to 11 fragments for more visual density

        for (let i = 0; i < numFragments; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1.5; // slightly faster pieces
            const spread = (Math.random() - 0.5) * 0.8;

            const { r, g, b } = this.originalColorRgb || { r: 220, g: 220, b: 220 }; // Use pre-parsed color
            this.fragments.push({
                x: this.x,
                y: this.y,
                radius: Math.random() * 5 + 2, // Radius between 2 and 7 pixels
                r: r,
                g: g,
                b: b,
                vx: Math.cos(angle + spread) * speed,
                vy: Math.sin(angle + spread) * speed - (Math.random() * 1.5),
                alpha: 1 // Start fully opaque
            });
        }

        // Visual death flourish: small ring pulse params
        this.deathRing = {
            radius: this.radius * 0.6,
            maxRadius: this.radius * 3.0,
            alpha: 0.9
        };
    }

    // Win animation: pulsing ring + confetti for winners
    startWinAnimation(frames = 180) {
        this.isWinning = true;
        this.winFrames = Math.max(60, frames | 0); // default 3 seconds at 60fps
        this.winTick = 0;
        // Pre-generate some confetti particles for the winner
        this.winConfetti = [];
        const confettiCount = Math.max(8, Math.floor(this.radius / 6));
        for (let i = 0; i < confettiCount; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = Math.random() * 2 + 1;
            this.winConfetti.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(a) * sp + (Math.random() - 0.5) * 2,
                vy: Math.sin(a) * sp - Math.random() * 1.5,
                life: Math.floor(Math.random() * 60) + 40,
                color: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`,
                size: Math.random() * 4 + 2,
                alpha: 1
            });
        }
    }

    // NEW: speech helper
    say(text, frames = 60) { this.speechText = String(text); this.speechFrames = Math.max(1, frames | 0); }
}