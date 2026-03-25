import { playParrySound } from './audio.js';
import { playBowImpactSound, playHitHurtSound } from './audio.js'; // NEW: impact sounds for deflected hits

function deflectProjectile(projectilePoint, weaponPoint, deflectingPlayer) {
    const arrow = projectilePoint.arrowRef || projectilePoint.projectileRef;
    if (!arrow || arrow.parryCooldown > 0) return;

    const dx = arrow.x - weaponPoint.x;
    const dy = arrow.y - weaponPoint.y;
    const magSq = dx * dx + dy * dy;

    if (magSq < 0.0001) {
        arrow.vx *= -1;
        arrow.vy *= -1;
        arrow.angle = Math.atan2(arrow.vy, arrow.vx);
    } else {
        const speed = Math.max(8, Math.hypot(arrow.vx, arrow.vy) * 1.05);
        const invMag = 1 / Math.sqrt(magSq);
        const nx = dx * invMag;
        const ny = dy * invMag;
        arrow.vx = nx * speed;
        arrow.vy = ny * speed;
        arrow.angle = Math.atan2(arrow.vy, arrow.vx);
    }

    arrow.parryCooldown = 6;

    // NEW: mark as deflected so it can deal damage to anyone it hits afterward
    arrow.deflected = true;
    arrow.lastDeflectedBy = deflectingPlayer || null;
    arrow.deflectedFrames = 0;
}

// Extended to handle arrow parries. Returns true when a parry or deflect occurred.
function checkWeaponParry(player1, player2, isMenuContext = false) {
    if (
        player1.type === 'basic' || player2.type === 'basic' ||
        player1.type === 'unarmed' || player2.type === 'unarmed' ||
        player1.stunned || player2.stunned || player1.onParryCooldown || player2.onParryCooldown
    ) {
        return false;
    }

    // FILTER: exclude 'body' points from parry consideration (grower/shrinker contact points)
    const weaponPoints1All = player1.getWeaponCollisionPoints();
    const weaponPoints2All = player2.getWeaponCollisionPoints();
    const weaponPoints1 = weaponPoints1All.filter(p => p.type !== 'body');
    const weaponPoints2 = weaponPoints2All.filter(p => p.type !== 'body');

    if (weaponPoints1.length === 0 || weaponPoints2.length === 0) return false;

    // Tighter buffer when bows are involved to reduce accidental parries
    let buffer = 8;
    if (player1.type === 'bow' || player2.type === 'bow') {
        buffer = 2; // drastically shrink parry overlap allowance for bows
    }

    // NEW: Scythe-specific tuning — slightly more generous buffer to catch hook parries
    if (player1.type === 'scythe' || player2.type === 'scythe') {
        buffer = Math.max(buffer, 10);
    }

    // Helper: require a weapon to be facing the opponent to allow a parry.
    // Use stricter cone for bows to cut down "random" parries.
    function requiredFacingDot(attackerType) {
        if (attackerType === 'bow') return 0.6;       // ~53° cone
        if (attackerType === 'shuriken') return 0.35; // ~69° cone
        if (attackerType === 'scythe') return 0.1;    // ~84° cone — wider due to curved blade
        return 0.2;                                   // ~78° cone (default)
    }
    function isFacing(attacker, defender) {
        const fx = Math.cos(attacker.weapon.angle);
        const fy = Math.sin(attacker.weapon.angle);
        const dx = defender.x - attacker.x;
        const dy = defender.y - attacker.y;
        const mag = Math.hypot(dx, dy) || 1;
        const dot = (fx * dx + fy * dy) / mag; // normalized directional alignment
        const minDot = requiredFacingDot(attacker.type);
        return dot > minDot;
    }

    for (const point1 of weaponPoints1) {
        for (const point2 of weaponPoints2) {
            const dx = point2.x - point1.x;
            const dy = point2.y - point1.y;
            const distSq = dx * dx + dy * dy;
            const r = point1.radius + point2.radius + buffer;
            if (distSq < r * r) {
                const point1IsProj = point1 && (point1.type === 'arrow' || point1.type === 'shuriken') && (point1.arrowRef || point1.projectileRef);
                const point2IsProj = point2 && (point2.type === 'arrow' || point2.type === 'shuriken') && (point2.arrowRef || point2.projectileRef);

                // Projectile deflects remain allowed regardless of facing
                if (point1IsProj || point2IsProj) {
                    if (!isMenuContext) {
                        playParrySound();
                    }
                    if (point1IsProj) deflectProjectile(point1, point2, player2); // NEW: pass deflecting player
                    if (point2IsProj) deflectProjectile(point2, point1, player1); // NEW: pass deflecting player
                    return true;
                }

                // Do not consider basic/unarmed for weapon parries
                if (
                    player1.type === 'basic' || player2.type === 'basic' ||
                    player1.type === 'unarmed' || player2.type === 'unarmed'
                ) {
                    continue;
                }

                // Directional parry check with tuned cones
                if (!isFacing(player1, player2)) continue;
                if (!isFacing(player2, player1)) continue;

                // NEW: If either contact point is a dedicated scythe guard/tip,
                // slightly prefer parry by proceeding directly (we already passed facing test).
                const scytheContact = (point1.type === 'scythe' || point1.type === 'scythe-guard' ||
                                        point2.type === 'scythe' || point2.type === 'scythe-guard');

                if (!isMenuContext) {
                    playParrySound();
                }

                player1.stun(15); 
                player2.stun(15);

                player1.reverseWeaponOnStunEnd = true;
                player2.reverseWeaponOnStunEnd = true;

                player1.gainParryCooldownOnStunEnd = true;
                player2.gainParryCooldownOnStunEnd = true;

                player1.gainImmunityOnStunEnd = false;
                player2.gainImmunityOnStunEnd = false;
                
                // Prevent immediate re-hits after parry
                player1.canHit = false;
                player2.canHit = false;

                return true;
            }
        }
    }
    
    return false;
}

function processDeflectedProjectiles(players, gameOverCallback) {
    // Iterate through every player's projectiles that were marked deflected
    for (const owner of players) {
        if (!owner.isAlive || !owner.weapon) continue;

        // Collect candidate projectiles
        const projectiles = [];
        if (owner.type === 'bow' && Array.isArray(owner.weapon.arrows)) {
            owner.weapon.arrows.forEach(a => { if (a && a.deflected) projectiles.push(a); });
        }
        if (owner.type === 'shuriken' && Array.isArray(owner.weapon.projectiles)) {
            owner.weapon.projectiles.forEach(p => { if (p && p.deflected) projectiles.push(p); });
        }
        if (!projectiles.length) continue;

        // Tick deflected frame counter
        projectiles.forEach(p => { p.deflectedFrames = (p.deflectedFrames || 0) + 1; });

        for (const victim of players) {
            if (!victim.isAlive) continue;

            // Allow hitting anyone (including original owner or deflector). Optional brief grace to avoid instant self-hit:
            // if (projectile.lastDeflectedBy === victim && (projectile.deflectedFrames < 2)) continue;

            for (const proj of projectiles) {
                // Simple circle hit test
                const dx = victim.x - proj.x;
                const dy = victim.y - proj.y;
                const distSq = dx * dx + dy * dy;

                // Reasonable radii per projectile type
                const pr =
                    proj.kind === 'arrow'
                        ? Math.max(10, (proj.baseRadius || 12))
                        : Math.max(10, (proj.collisionRadius || 14));

                const effectiveR = victim.radius + pr;

                if (distSq <= effectiveR * effectiveR) {
                    // Deal 1 damage (projectile base damage)
                    victim.health -= 1;

                    // Play impact sound by kind
                    if (proj.kind === 'arrow') {
                        playBowImpactSound();
                    } else {
                        playHitHurtSound();
                    }

                    // Stun behavior approximating the projectile weapon
                    const stun = proj.kind === 'arrow' ? { attacker: 6, defender: 6 } : { attacker: 6, defender: 8 };
                    const attacker = proj.lastDeflectedBy || owner; // credit the deflector if present
                    // NEW: prevent friendly fire in multi-player team modes
                    if (players.length > 2 && attacker && attacker.team && victim.team && attacker.team === victim.team) {
                        continue;
                    }

                    // Apply stuns
                    victim.stun(stun.defender);
                    if (attacker && attacker.isAlive && stun.attacker > 0) {
                        attacker.stun(stun.attacker);
                    }

                    // Immunity on stun end mirrors bow behavior for arrows only
                    victim.gainImmunityOnStunEnd = (proj.kind === 'arrow');

                    // Remove projectile after hit
                    proj.life = 0;

                    // Death handling
                    const DEATH_THRESHOLD = 0.5;
                    if (victim.health <= DEATH_THRESHOLD) {
                        victim.health = 0;
                    }

                    if (victim.health <= 0) {
                        if (victim.isAlive) {
                            victim.isAlive = false;
                            victim.spawnFragments();
                        }
                        if (typeof gameOverCallback === 'function') {
                            // In non-FFA modes, end round if applicable
                            gameOverCallback(attacker || null);
                        }
                    }
                }
            }
        }
    }
}

// Helper to test Crusher squish condition
function checkCrusherSquish(crusher, victim, gameOverCallback) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return false;
    if (!crusher || !victim || !crusher.isAlive || !victim.isAlive) return false;

    // Require the crusher to be physically contacting the victim (or extremely close)
    const dx = victim.x - crusher.x;
    const dy = victim.y - crusher.y;
    const centerDist = Math.hypot(dx, dy);
    const contactThreshold = (crusher.radius + victim.radius) * 1.02; // small slack for numerical jitter
    if (centerDist > contactThreshold) return false;

    // Determine proximity to walls for the victim
    const margin = Math.max(14, Math.floor(victim.radius * 0.45));
    const nearLeft = (victim.x - victim.radius) <= margin;
    const nearRight = (canvas.width - (victim.x + victim.radius)) <= margin;
    const nearTop = (victim.y - victim.radius) <= margin;
    const nearBottom = (canvas.height - (victim.y + victim.radius)) <= margin;

    if (!(nearLeft || nearRight || nearTop || nearBottom)) return false;

    // Ensure victim is between crusher and the wall being checked (crusher is "pressing" them into it)
    const pressingHoriz =
        (nearLeft && crusher.x > victim.x) ||
        (nearRight && crusher.x < victim.x);
    const pressingVert =
        (nearTop && crusher.y > victim.y) ||
        (nearBottom && crusher.y < victim.y);

    if (!(pressingHoriz || pressingVert)) return false;

    // Require relative motion of crusher towards victim to reduce false-positives
    const relVx = crusher.vx - victim.vx;
    const relVy = crusher.vy - victim.vy;
    const approaching = (relVx * dx + relVy * dy) > 0; // moving generally toward victim
    if (!approaching) return false;

    // Corner squish if both axes near walls — guaranteed instant kill
    const corner = (nearLeft || nearRight) && (nearTop || nearBottom);

    // Apply lethal damage
    const lethal = corner || pressingHoriz || pressingVert;
    if (lethal) {
        // NEW: show a squish animation before killing the victim
        const axis = pressingHoriz ? 'x' : (pressingVert ? 'y' : 'x');
        if (typeof victim.startCrushKill === 'function') {
            // Slightly longer animation if cornered
            victim.startCrushKill(axis, 14);
        } else {
            // Fallback: immediate kill if method missing, but protect Dummy Ball
            if (victim.type !== 'dummyball' && isFinite(victim.health)) {
                victim.health = 0;
                if (victim.isAlive) {
                    victim.isAlive = false;
                    victim.spawnFragments();
                }
            }
        }

        // Play impact sound and finish (winner will be resolved when victim actually dies)
        playHitHurtSound();
        return true;
    }
    return false;
}

// NEW: Grower crush logic — if Grower reaches size >= 100, it crushes opponents on direct contact.
function checkGrowerCrush(grower, victim, gameOverCallback) {
    if (!grower || !victim || !grower.isAlive || !victim.isAlive) return false;
    if (grower.type !== 'grower') return false;
    if (grower.radius < 100) return false; // threshold for crush ability

    // Do not crush teammates in team-based modes
    if (grower.team && victim.team && grower.team === victim.team) return false;

    // Require physical contact/overlap
    const dx = victim.x - grower.x;
    const dy = victim.y - grower.y;
    const centerDist = Math.hypot(dx, dy);
    const contactThreshold = (grower.radius + victim.radius) * 1.02;
    if (centerDist > contactThreshold) return false;

    // Choose axis for squash effect based on stronger separation axis
    const axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';

    // Trigger a short squash animation before killing the victim
    if (typeof victim.startCrushKill === 'function') {
        victim.startCrushKill(axis, 10);
    } else {
        // Fallback: immediate kill if method missing, but protect Dummy Ball
        if (victim.type !== 'dummyball' && isFinite(victim.health)) {
            victim.health = 0;
            if (victim.isAlive) {
                victim.isAlive = false;
                victim.spawnFragments();
            }
        }
    }

    // Play impact sound; winner resolution occurs when death finalizes
    playHitHurtSound();
    return true;
}

function checkWeaponCollision(attacker, defender, gameOverCallback, players, isMenuContext = false) {
    const canAttack = attacker.weapon.canAttack(attacker.stunned);
    if (attacker.type === 'basic' || !defender.isAlive || !attacker.isAlive || !canAttack || defender.isImmune) return;
    if (players.length > 2 && attacker.team && defender.team && attacker.team === defender.team) return;
    
    const weaponCollisionPoints = attacker.getWeaponCollisionPoints();
    const defenderWeaponPoints = defender.getWeaponCollisionPoints();
    if (weaponCollisionPoints.length === 0) return;

    let weaponToWeaponCollision = false;
    if (attacker.type !== 'unarmed' && defender.type !== 'unarmed' && defenderWeaponPoints.length > 0) {
        const buffer = 5;
        for (const attackPoint of weaponCollisionPoints) {
            // Ignore 'body' contact points in weapon-to-weapon clash detection
            if (attackPoint.type === 'body') continue;
            for (const defendPoint of defenderWeaponPoints) {
                if (defendPoint.type === 'body') continue; // ignore defender 'body' as well
                const dx = defendPoint.x - attackPoint.x;
                const dy = defendPoint.y - attackPoint.y;
                const distSq = dx * dx + dy * dy;
                const r = attackPoint.radius + defendPoint.radius + buffer;
                if (distSq < r * r) {
                    weaponToWeaponCollision = true;
                    break;
                }
            }
            if (weaponToWeaponCollision) break;
        }
    }

    let hitDetected = false;
    let hitPoint = null; // NEW: capture which point actually hit
    for (const weaponPoint of weaponCollisionPoints) {
        // Shuriken's held weapon (the "spawner") should not deal damage; skip its points.
        if (weaponPoint.type === 'shuriken-weapon') continue;

        const dx = defender.x - weaponPoint.x;
        const dy = defender.y - weaponPoint.y;
        const distSq = dx * dx + dy * dy;

        const effectiveRadius = (attacker.type === 'dagger') ? 
            defender.radius + weaponPoint.radius + 2 : 
            defender.radius + weaponPoint.radius;

        const blocked = (attacker.type === 'unarmed') ? false : weaponToWeaponCollision;

        if (distSq < effectiveRadius * effectiveRadius && !blocked) {
            hitDetected = true;
            hitPoint = weaponPoint; // NEW
            break;
        }
    }

    if (hitDetected) {
        // NEW: if an arrow caused the hit, delete it immediately to reduce lag
        if (hitPoint && (hitPoint.type === 'arrow' || hitPoint.type === 'shuriken' || hitPoint.type === 'ak-bullet' || hitPoint.type === 'flame' || hitPoint.type === 'custom-proj') && (hitPoint.arrowRef || hitPoint.projectileRef)) {
            // Mark projectile for removal (include flame/custom-proj so flamethrower and custom projectiles are consumed)
            const proj = hitPoint.arrowRef || hitPoint.projectileRef;
            proj.life = 0;
        }

        if (!isMenuContext) {
            attacker.weapon.playHitSound();
        }

        defender.health -= attacker.weapon.damage;

        const DEATH_THRESHOLD = 0.5;
        if (defender.health <= DEATH_THRESHOLD) {
            defender.health = 0;
        }

        if (defender.health <= 0) {
            if (defender.isAlive) {
                defender.isAlive = false;
                defender.spawnFragments();
            }
            attacker.weapon.onHit(defender);
            attacker.weapon.onSuccessfulHit();
            let damageDisplay = null;
            if (players.length === 2) {
                const damageDisplayId = (attacker === players[0]) ? 'damage-display-left' : 'damage-display-right';
                damageDisplay = document.getElementById(damageDisplayId);
            } else {
                const attackerIndex = players.indexOf(attacker);
                if (attackerIndex !== -1) {
                    damageDisplay = document.getElementById(`damage-display-ffa-value-${attackerIndex}`);
                }
            }
            if (damageDisplay) {
                damageDisplay.innerHTML = attacker.weapon.getDamageDisplayText();
                damageDisplay.style.color = attacker.color;
            }
            gameOverCallback(attacker);
            return;
        }
        
        attacker.weapon.onHit(defender);

        let damageDisplayId;
        let damageDisplay;
        
        if (players.length === 2) {
            damageDisplayId = (attacker === players[0]) ? 'damage-display-left' : 'damage-display-right';
            damageDisplay = document.getElementById(damageDisplayId);
        } else {
            const attackerIndex = players.indexOf(attacker);
            if (attackerIndex !== -1) {
                damageDisplay = document.getElementById(`damage-display-ffa-value-${attackerIndex}`);
            }
        }
        
        if (damageDisplay) {
            damageDisplay.innerHTML = attacker.weapon.getDamageDisplayText();
            damageDisplay.style.color = attacker.color;
        }
        
        const stunDurations = attacker.weapon.getHitStunDurations();
        defender.stun(stunDurations.defender);
        if (stunDurations.attacker > 0) {
            attacker.stun(stunDurations.attacker);
        }

        attacker.reverseWeaponOnStunEnd = attacker.weapon.shouldReverseOnHit();
        defender.reverseWeaponOnStunEnd = false;
        
        defender.gainImmunityOnStunEnd = attacker.weapon.grantsImmunityOnHit();
        attacker.gainImmunityOnStunEnd = false;
        
        defender.gainParryCooldownOnStunEnd = true;
        attacker.gainParryCooldownOnStunEnd = false;

        defender.isVisuallyStunned = true;
        defender.stunEffectAlpha = 1;
        attacker.isVisuallyStunned = false;

        attacker.weapon.onSuccessfulHit();

        if (defender.health <= 0) {
            gameOverCallback(attacker);
        }
    }
}

export function handleCollision(player1, player2, gameOverCallback, players, isMenuContext = false) {
    if (player1.isAlive && player2.isAlive && !player1.stunned && !player2.stunned) {
        const dx = player2.x - player1.x;
        const dy = player2.y - player1.y;
        const minDistance = player1.radius + player2.radius;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistance * minDistance) {
            const distance = Math.sqrt(distSq) || 0.00001;

            const overlap = minDistance - distance;
            const separationX = (dx / distance) * (overlap / 2);
            const separationY = (dy / distance) * (overlap / 2);

            player1.x -= separationX;
            player1.y -= separationY;
            player2.x += separationX;
            player2.y += separationY;

            // Compute relative impact speed along the collision normal
            const nx = dx / distance;
            const ny = dy / distance;
            const relVx = player2.vx - player1.vx;
            const relVy = player2.vy - player1.vy;
            const speedAlongNormal = Math.abs(relVx * nx + relVy * ny);

            // Speed-based squash: higher impact speed => deeper squash (smaller factor)
            function squishAmountForSpeed(speed) {
                const min = 0.55;  // deepest squash
                const max = 0.95;  // barely squash
                const s = Math.max(0, Math.min(22, speed)); // clamp to a sensible range
                const t = Math.sqrt(s / 22); // ease to give more feel at lower speeds
                return max - t * (max - min);
            }
            const squashAmount = squishAmountForSpeed(speedAlongNormal);

            // NEW: subtle squash on ball-to-ball bounces scaled by impact speed
            const axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            if (typeof player1.triggerSquash === 'function') player1.triggerSquash(axis, squashAmount);
            if (typeof player2.triggerSquash === 'function') player2.triggerSquash(axis, squashAmount);

            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            const vx1 = player1.vx * cos + player1.vy * sin;
            const vy1 = player1.vy * cos - player1.vx * sin;
            const vx2 = player2.vx * cos + player2.vy * sin;
            const vy2 = player2.vy * cos - player2.vx * sin;

            const newVx1 = ((player1.mass - player2.mass) * vx1 + 2 * player2.mass * vx2) / (player1.mass + player2.mass);
            const newVx2 = ((player2.mass - player1.mass) * vx2 + 2 * player1.mass * vx1) / (player1.mass + player2.mass);

            player1.vx = newVx1 * cos - vy1 * sin;
            player1.vy = vy1 * cos + newVx1 * sin;
            player2.vx = newVx2 * cos - vy2 * sin;
            player2.vy = vy2 * cos + newVx2 * sin;

            const speed1 = Math.sqrt(player1.vx * player1.vx + player1.vy * player1.vy);
            const speed2 = Math.sqrt(player2.vx * player2.vx + player2.vy * player2.vy);
            
            if (speed1 > 0) {
                player1.vx = (player1.vx / speed1) * player1.speed;
                player1.vy = (player1.vy / speed1) * player1.speed;
            }
            if (speed2 > 0) {
                player2.vx = (player2.vx / speed2) * player2.speed;
                player2.vy = (player2.vy / speed2) * player2.speed;
            }
        }
    }
    
    let parried = false;
    // Crusher squish check happens before parry/weapon clashes, during close contact.
    // Try both orientations.
    const anyCrusher =
        (player1.type === 'crusher' && player2.type !== 'crusher') ||
        (player2.type === 'crusher' && player1.type !== 'crusher');
    if (anyCrusher) {
        const c = player1.type === 'crusher' ? player1 : player2;
        const v = player1.type === 'crusher' ? player2 : player1;
        if (checkCrusherSquish(c, v, gameOverCallback)) {
            // Still allow deflected projectile damage processing afterwards
            processDeflectedProjectiles(players, gameOverCallback);
            return;
        }
    }

    // NEW: Grower crush check (size-based instant crush on contact)
    const anyGrower =
        (player1.type === 'grower' && player2.type !== 'grower') ||
        (player2.type === 'grower' && player1.type !== 'grower');
    if (anyGrower) {
        const g = player1.type === 'grower' ? player1 : player2;
        const v = player1.type === 'grower' ? player2 : player1;
        if (checkGrowerCrush(g, v, gameOverCallback)) {
            processDeflectedProjectiles(players, gameOverCallback);
            return;
        }
    }

    if (!(players.length > 2 && player1.team && player2.team && player1.team === player2.team)) {
        parried = checkWeaponParry(player1, player2, isMenuContext);
    }

    if (parried) {
        // Even if a parry happened, still process deflected projectile damage for any already-deflected shots
        processDeflectedProjectiles(players, gameOverCallback);
        return;
    }

    checkWeaponCollision(player1, player2, gameOverCallback, players, isMenuContext);
    checkWeaponCollision(player2, player1, gameOverCallback, players, isMenuContext);

    // NEW: After regular collisions, resolve any deflected projectile hits
    processDeflectedProjectiles(players, gameOverCallback);
}