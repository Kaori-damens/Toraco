# Ball Battle Arena — Game Design Document (English)

> **Version**: 1.0 | **Engine**: Vanilla HTML5 Canvas + Web Audio API | **Inspired by**: Weapon Ball Battles (earclack)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Concept](#2-core-concept)
3. [Game Flow](#3-game-flow)
4. [Arena (Playing Field)](#4-arena-playing-field)
5. [Ball (Fighter Unit)](#5-ball-fighter-unit)
6. [Physics System](#6-physics-system)
7. [Weapons](#7-weapons)
8. [Combat Mechanics](#8-combat-mechanics)
9. [Special Mechanics](#9-special-mechanics)
10. [Projectile System](#10-projectile-system)
11. [Scaling System (Power Growth)](#11-scaling-system-power-growth)
12. [Visual & Audio Feedback](#12-visual--audio-feedback)
13. [Game Modes & Settings](#13-game-modes--settings)
14. [Technical Reference](#14-technical-reference)

---

## 1. Overview

**Ball Battle Arena** is a local, self-contained browser game where 2–6 bouncing balls fight each other inside a closed arena. Each ball is armed with a weapon and moves purely via physics — wall bounces, collisions, and knockback. There is no player control; the game is a pure physics/systems simulation with spectator appeal.

| Property | Value |
|----------|-------|
| Platform | Web Browser (single HTML file) |
| Players | 0 (spectator) — future: 1–2 human |
| Match Type | Free-for-all (last ball standing) |
| Fighters | 2–6 balls per match |
| Canvas Size | 800 × 800 px |

---

## 2. Core Concept

> *"Balls with weapons bounce inside an arena. Each wall bounce gives a speed boost. Weapons grow stronger with every hit. The last ball alive wins."*

**Design pillars:**
- **Pure physics movement** — no AI steering, only bouncing off walls and opponents
- **Emergent strategy** — weapon scaling means early kills create snowballing power
- **Readable chaos** — visual feedback (damage numbers, particles, flash) keeps the spectator informed

---

## 3. Game Flow

```
[MENU SCREEN]
  → Configure fighters (2–6 balls)
  → Each fighter: choose weapon + auto-assigned color
  → Select Arena
  → Press ⚔️ FIGHT!

[GAME SCREEN]
  → Balls launch from spread positions toward center
  → Physics simulation runs (wall bounce, collision, weapon attacks)
  → When only 1 ball remains alive → match ends

[RESULT SCREEN]
  → Winner announced
  → Stats per ball: Damage Dealt, Kills, Parries, Survival time
  → Options: Rematch | Back to Menu
```

**Launch behavior:**
- Each ball launches from a spread angle toward the arena center
- Launch speed is randomized per ball: **3.0 – 6.0 units/frame**
- Visual indicator at match start:
  - Speed < 3.7 → `😴 Bad Start`
  - Speed > 4.8 → `🔥 Great Start!`

---

## 4. Arena (Playing Field)

Five arena shapes are available, each affecting how balls ricochet and where they are cornered.

| Arena | Type | Dimensions | Notes |
|-------|------|-----------|-------|
| **Square** | Rectangle | 800 × 800 | Full canvas, many corner traps |
| **Circle** | Circle | radius = 220 px | Smooth, no corners, constant bounce angles |
| **Rectangle** | Rectangle | 700 × 500 (centered) | Wider than tall, horizontal momentum dominant |
| **Cross** | Cross (+) | arm = 240, thick = 300 | 4 pockets, complex geometry |
| **🕳️ Hole** | Square + inner hole | 800 × 800, hole r = 70 (center) | Square with circular obstacle in middle; ball bounces off hole edge |

**Wall bounce rule:** `WALL_BOUNCE = 1.0` (perfectly elastic — no energy loss on wall contact).

---

## 5. Ball (Fighter Unit)

Every ball is a fighter with a fixed set of base stats. Stats do **not** vary between balls — differentiation comes from weapon choice and scaling.

| Stat | Value | Description |
|------|-------|-------------|
| Max HP | 100 | Starting and maximum health |
| Radius | 24 px | Physical collision radius |
| Mass | 28.8 | Used in momentum calculation (radius² × 0.05) |
| Evade Chance | 10% | Chance to completely dodge an incoming hit |
| Evade Duration | 60 frames (1 s) | Immune + cyan glow when evade triggers |
| Crit Chance | 20% | Chance the **attacker** lands a critical hit |
| Crit Multiplier | ×1.5 (150%) | Damage multiplier on a critical hit |
| Immunity Frames | 18 frames | Invincibility window after being hit |
| Ball Colors | 6 available | Blue, Red, Green, Orange, Purple, Pink |

**Multi-ball setup:**
- Minimum 2 fighters, maximum 6 fighters per match
- Colors are assigned sequentially from the color pool

---

## 6. Physics System

### 6.1 Movement

| Parameter | Value |
|-----------|-------|
| Friction | 0.999 per frame (`vx *= 0.999`) |
| Max Speed | 18 units/frame (clamped after all forces applied) |
| Gravity (optional) | +0.15 vy per frame (toggle via 🌍 button) |

### 6.2 Wall Bounce

- Wall collision reflects velocity using: `v -= dot(v, n) × (1 + WALL_BOUNCE) × n`
- Ball is snapped to wall surface to prevent tunneling
- **Wall Speed Boost**: On every wall collision, speed ×1.1 immediately
  - `wallBoostFactor` decays by ×0.9747 each frame
  - Returns to baseline in ~3 seconds (180 frames)
  - `bounceCooldown` = 12 frames after wall hit (prevents re-bounce flicker)

### 6.3 Ball-to-Ball Collision

- **Type**: Elastic collision with coefficient **e = 1.85** (slightly superelastic)
- **Positional push**: `overlap × 0.52` to separate overlapping balls
- `bounceCooldown` = 20 frames for both balls after collision
- Collision resolves only when `bounceCooldown == 0` for both balls

### 6.4 Squash Effect

On hit: `squashX = 1.3, squashY = 0.75`, recovers at rate 0.15/frame (visual only)

---

## 7. Weapons

Eight weapons are available, each with unique attack geometry, damage, knockback, and scaling behavior.

### 7.1 Weapon Stats Table

| # | Weapon | Emoji | Base Dmg | Base KB | Weapon Length | Hit Radius | Atk Cooldown | Scaling Stat |
|---|--------|-------|----------|---------|---------------|-----------|-------------|-------------|
| 1 | Fists | 🥊 | 2 | 2 | 22 px | 11 px | 16 frames | Attack Speed |
| 2 | Sword | ⚔️ | 1 | 4 | 50 px | 8 px | 28 frames | Damage |
| 3 | Dagger | 🗡️ | 1 | 2 | 28 px | 8 px | 18 frames | Spin Speed |
| 4 | Spear | 🔱 | 1 | 5 | 65 px | 8 px | 38 frames | Length + Dmg |
| 5 | Bow | 🏹 | 0\* | 1 | 38 px | 8 px | 10 frames | Arrow Count |
| 6 | Scythe | 🌙 | 1 | 5 | 48 px | 18 px | 34 frames | Dual Blade |
| 7 | Hammer | 🔨 | 1 | 12 | 38 px | 14 px | 48 frames | Knockback |
| 8 | Shuriken | ⭐ | 0\* | 1 | 30 px | 10 px | 10 frames | Star Count |

\* Bow and Shuriken deal 0 melee damage — all damage comes from projectiles.

### 7.2 Weapon Descriptions

#### 🥊 Fists
Fastest attack rate in the game. Short range but rewards aggressive playstyle. Scales attack speed — higher hit count means faster punches, creating a momentum snowball effect.

#### ⚔️ Sword
Balanced melee weapon with medium length and decent knockback. Scales raw damage — every hit permanently increases damage output. Simple and reliable.

#### 🗡️ Dagger
Short blade with rapid swing speed. Scales spin speed — the weapon rotates faster with each hit, increasing hit opportunities and making it harder to dodge.

#### 🔱 Spear
Longest melee reach in the game. Slow attack but high knockback. Scales both length and damage simultaneously — becomes an almost untouchable long-range melee weapon late-game.

#### 🏹 Bow
Fires arrows every **130 frames**. Arrow speed: **7.5 units/frame**. Starts with 1 arrow per volley; each hit adds +1 arrow (unlimited). At high scale: fires spread volleys.

#### 🌙 Scythe
Wide arc attack (hitRadius 18 px). Activates **dual blades at 5 hits** — one blade forward, one backward. Covers nearly 360° at high scaling.

#### 🔨 Hammer
Slowest weapon but massive base knockback (12). Every hit permanently increases knockback. Late-game Hammer can launch opponents across the entire arena.

#### ⭐ Shuriken
Fires shurikens every **120 frames**. Shuriken speed: **6 units/frame**, bounces off walls up to **2 times**. Starts with 1 star; each hit adds +1 (unlimited). Shurikens can be deflected by weapon contact.

---

## 8. Combat Mechanics

### 8.1 Damage Formula

```
finalDamage = (baseDamage + bonusDamage) × critMultiplier × evadeCheck
```

- **critMultiplier** = 1.5 if `Math.random() < critChance (0.20)`, else 1.0
- **evadeCheck**: if `Math.random() < evadeChance (0.10)` → damage = 0 (full dodge)
- Evade is checked **before** crit — no crit can overcome an evade

### 8.2 Knockback

```
knockbackForce = (baseKnockback + bonusKnockback) × 1.4
```
Applied in the direction from attacker → defender.

### 8.3 Parry System

A parry occurs when two weapon tips meet with opposing intent:

**Conditions:**
1. Both balls have `parryCooldown == 0`
2. Weapon tip distance < threshold
3. Dot product of both weapon directions > 0.2 (weapons aimed at each other)

**Parry outcome:**
| Effect | Value |
|--------|-------|
| Recoil impulse | 5.5 units outward |
| Parry cooldown (both) | 25 frames |
| Bounce cooldown (both) | 22 frames |
| Weapon angle deflection | +π × 0.15 rad |
| Sound | Double square-wave tone |
| Particles | 14 golden sparks |

---

## 9. Special Mechanics

### 9.1 Evade

| Property | Value |
|----------|-------|
| Trigger chance | 10% per incoming hit |
| Duration | 60 frames (1 second) |
| Effect | Complete immunity, cyan glow aura |
| Display | "EVADE" text in cyan |
| Immunity frames | 20 (extended vs normal 18) |

### 9.2 Critical Hit

| Property | Value |
|----------|-------|
| Trigger chance | 20% per outgoing hit |
| Damage multiplier | ×1.5 |
| Visual cue | ⚡CRIT! label + gold damage number |
| Blood particles | ×2 (12 vs normal 6) |

### 9.3 Wall Speed Boost

| Property | Value |
|----------|-------|
| Trigger | Any wall collision (speed > 0.5) |
| Initial boost | ×1.1 speed |
| Decay rate | ×0.9747 per frame |
| Full decay time | ~180 frames (3 seconds) |
| Sparks spawned | 6 golden particles |

---

## 10. Projectile System

### Arrows (🏹 Bow)
| Property | Value |
|----------|-------|
| Speed | 7.5 units/frame |
| Damage | 1 (scales with arrowCount volley) |
| Fire interval | 130 frames |
| Wall behavior | Disappears on wall contact |
| Deflectable | Yes — by weapon tip contact |
| After deflect | Arrow's owner changes to deflecting ball |

### Shurikens (⭐)
| Property | Value |
|----------|-------|
| Speed | 6 units/frame |
| Damage | 1 |
| Fire interval | 120 frames |
| Wall bounces | Up to 2 times |
| Deflectable | Yes — by weapon tip contact |
| Spin | Visual rotation effect during flight |

**Projectile deflection:** When a weapon tip comes within range of a projectile, the projectile is deflected and ownership transfers to the deflecting ball. 5 spark particles are spawned.

---

## 11. Scaling System (Power Growth)

Every weapon tracks a **hits counter**. Each confirmed hit (not evaded) triggers an `onHit()` upgrade.

| Weapon | Scaling Stat | Per Hit | Cap |
|--------|-------------|---------|-----|
| 🥊 Fists | Attack Cooldown | −0.5 frames | min 8 frames |
| ⚔️ Sword | Bonus Damage | +1 | None |
| 🗡️ Dagger | Spin Speed | +0.012 | max 0.55 |
| 🔱 Spear | Length + Damage | +4 px / +0.5 | None |
| 🏹 Bow | Arrow Count | +1 arrow | None (∞) |
| 🌙 Scythe | Dual Mode | Activates at 5 hits | 2 blades |
| 🔨 Hammer | Knockback | +0.8 | None |
| ⭐ Shuriken | Star Count | +1 | None (∞) |

**Derived weapon stats:**
```javascript
getSpeed()  = (baseSpeed + spinBonus) × scale
getDamage() = baseDamage + bonusDamage
getKnockback() = baseKnockback + bonusKnockback
getLength() = radius + baseLength + bonusLength
```

---

## 12. Visual & Audio Feedback

### 12.1 Particle Effects

| Event | Particle Count | Color | Lifetime |
|-------|---------------|-------|----------|
| Wall bounce | 6 | Gold/orange | 20–35 frames |
| Parry | 14 | Gold | 25–40 frames |
| Normal hit | 6 blood | Red tones | 18–28 frames |
| Critical hit | 12 blood | Red tones | 18–28 frames |
| Projectile deflect | 5 | Cyan/white | 20 frames |
| Death explosion | 30 | Mixed colors | 35–60 frames |

### 12.2 Floating Damage Numbers

- Normal hit: `-[damage]` in white
- Critical hit: `⚡CRIT!` in gold + `-[damage]` in gold (offset ±4 px)
- Evade: `EVADE` in cyan (`#aaffee`)
- Scale up: Displayed when weapon levels up

### 12.3 Sound Effects (Web Audio API)

| Event | Description |
|-------|-------------|
| Hit | Sawtooth 200 Hz, 0.15s decay |
| Parry | Square 880 Hz + 660 Hz chord, 0.1–0.12s |
| Shoot (bow/shuriken) | Sine 440 Hz, 0.08s |
| Death | Sawtooth 100 Hz + Square 60 Hz |
| Scale up | Sine 1100 Hz, 0.15s |

---

## 13. Game Modes & Settings

### In-Match Controls

| Button | Action |
|--------|--------|
| ⏸ Pause | Pause/resume simulation |
| ← Menu | Return to menu (ends match) |
| 🌍 Gravity: Off/On | Toggle downward gravity (+0.15 vy/frame) |
| 🔍 100% | Zoom cycle: 100% → 85% → 70% → 55% |
| ⚡ Speed: 1x | Game speed cycle: 1× → 2× → 3× → 5× |

### Pre-Match Configuration

| Option | Range | Default |
|--------|-------|---------|
| Number of fighters | 2–6 | 2 |
| Weapon per fighter | Any of 8 | Sword |
| Arena | 5 choices | Square |

---

## 14. Technical Reference

### Core Constants

| Constant | Value |
|----------|-------|
| `CW / CH` | 800 / 800 px |
| `BALL_R` | 24 px |
| `BASE_HP` | 100 |
| `WALL_BOUNCE` | 1.0 |
| Friction | 0.999 / frame |
| Max Speed | 18 units/frame |
| Elastic Coeff (e) | 1.85 |
| Gravity | 0.15 vy/frame |
| Wall Boost | ×1.1, decay 0.9747/frame |
| Launch Speed Range | 3.0 – 6.0 |
| Frame Rate Target | 60 fps (requestAnimationFrame) |

### File Structure

```
ball-battle/
└── index.html      ← entire game (self-contained, no dependencies)
```

### Key Code Sections

| Section | Description |
|---------|-------------|
| `WEAPON_DEFS` | Array of 8 weapon configuration objects |
| `ARENAS` | Object map of 5 arena configs |
| `class Ball` | Fighter unit: stats, physics, weapon, rendering |
| `clampToBall()` | Wall collision & bounce per arena type |
| `collide()` | Ball-to-ball elastic collision |
| `_checkWeaponHit()` | Melee weapon hit detection & damage |
| `step()` | Main game loop: physics, combat, particles |
| `drawArena()` | Arena rendering per type |
| `initGame()` | Match initialization, ball spawning |
| `buildFightersPanel()` | Pre-match UI builder |
| `buildHUD()` | Dynamic HP bar generator |

---

*Ball Battle Arena — GDD v1.0*
