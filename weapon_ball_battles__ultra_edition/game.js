import { players, resetPlayers } from './state.js';
import { handleCollision } from './collision.js';
import { updateLoserUI, resetVersusUI } from './ui.js';
import { playClickSound, areSoundsReady } from './audio.js';

let isPlaying = false;
let gameEnded = false;
let animationFrameId = null;
let roundWinner = null; // store winner but allow world to keep simming so animations/fragments play

let ctx;
let canvas;
let playButton;
let resetButton;
let gameContainer;

// NEW: drag state (fix ReferenceError)
let draggingPlayer = null;
let dragPointerId = null;

// NEW: gravity enabled state (true => gravity on, false => off)
let gravityEnabled = true;
// NEW: horizontal velocity state
let horizontalEnabled = true;
window.horizontalEnabled = true;

// NEW: grid overlay toggle
let gridEnabled = true;

// NEW: time scale for simulation speed
let timeScale = 1;

// FIX: define currentMode with a safe default to prevent ReferenceError before setGameMode is called
let currentMode = 'classic';

// NEW: track last damage display strings to trigger speech once per change
const lastDamageTexts = [];

// NEW: zoom scaling state helpers
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.4;
const SCALE_STEP = 0.1;

// Utility to read current effective scale from computed transform (handles CSS classes or inline styles)
function getCurrentScale() {
    const style = window.getComputedStyle(gameContainer);
    const transform = style.transform || style.webkitTransform || style.mozTransform;
    if (transform && transform !== 'none') {
        // matrix(a, b, c, d, tx, ty) -> scaleX = a, scaleY = d
        const match = transform.match(/matrix\(([^)]+)\)/);
        if (match) {
            const parts = match[1].split(',').map(v => parseFloat(v.trim()));
            if (parts.length >= 4) {
                const a = parts[0], d = parts[3];
                // If non-uniform, just return X
                return isFinite(a) ? a : 0.7;
            }
        }
        // matrix3d(...) fallback
        const match3d = transform.match(/matrix3d\(([^)]+)\)/);
        if (match3d) {
            const parts = match3d[1].split(',').map(v => parseFloat(v.trim()));
            // scaleX is parts[0]
            if (parts.length >= 1 && isFinite(parts[0])) return parts[0];
        }
    }
    // Default baseline defined in CSS
    return 0.7;
}

function applyScale(scale) {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    // Inline transform overrides class-based transform
    gameContainer.style.transform = `scale(${clamped})`;
}

function gameOver(winner) {
    // Avoid double-processing the same round
    if (roundWinner === winner) return;

    // Record the winner but do NOT flip the global gameEnded flag so the world continues to simulate.
    // This ensures death fragments, win animation and other visual effects still play out.
    roundWinner = winner;

    if (currentMode === 'ffa') {
        // No special UI; leave fragments to play out and don't short-circuit simulation.
        return;
    }

    // Classic: determine loser and UI
    const loser = (winner === players[0]) ? players[1] : players[0];
    if (loser) {
        // Trigger death animation by ensuring fragments and flags are set
        loser.isAlive = false;
        // spawnFragments will set deathAnimFrames and fragments
        loser.spawnFragments();
        updateLoserUI(loser === players[0] ? 'left' : 'right');
    }

    // Winner flourish: start their win animation if present and alive
    if (winner && typeof winner.startWinAnimation === 'function' && winner.isAlive) {
        // give a confident speech bubble and then start visual win animation
        try {
            winner.say('Victory!', 90);
            winner.startWinAnimation(Math.max(120, Math.floor((winner.radius / 35) * 180)));
        } catch (e) {
            // swallow any issues during celebratory animation to avoid breaking game flow
            console.warn('Win animation failed:', e);
        }
    }
}

function updatePlayButtonState() {
    if (!playButton) return;

    // NEW: In FFA and Teams, disable play when fewer than 2 circles (no visual feedback)
    if (currentMode === 'ffa' || currentMode === 'teams') {
        const aliveOrTotal = players.length; // At reset all are alive
        if (aliveOrTotal < 2) {
            playButton.disabled = true;
            playButton.textContent = isPlaying ? 'Pause' : 'Play';
            playButton.classList.toggle('paused', isPlaying);
            return;
        }
    }

    playButton.disabled = false;
    playButton.textContent = isPlaying ? 'Pause' : 'Play';
    playButton.classList.toggle('paused', isPlaying);
}

function updateGravityButtonUI() {
    const gravityBtn = document.getElementById('gravityButton');
    if (!gravityBtn) return;
    gravityBtn.textContent = `Gravity: ${gravityEnabled ? 'On' : 'Off'}`;

    // On => white button with black text and black outline
    // Off => black button with white text and white outline
    if (gravityEnabled) {
        gravityBtn.style.backgroundColor = 'var(--white)';
        gravityBtn.style.color = 'var(--black)';
        gravityBtn.style.borderColor = 'var(--black)';
    } else {
        gravityBtn.style.backgroundColor = 'var(--black)';
        gravityBtn.style.color = 'var(--white)';
        gravityBtn.style.borderColor = 'var(--white)'; // Outline white when off
    }
}

// NEW: Horizontal button UI
function updateHorizontalButtonUI() {
    const btn = document.getElementById('horizButton');
    if (!btn) return;
    btn.textContent = `Horizontal: ${horizontalEnabled ? 'On' : 'Off'}`;
    btn.style.backgroundColor = horizontalEnabled ? 'var(--white)' : 'var(--black)';
    btn.style.color = horizontalEnabled ? 'var(--black)' : 'var(--white)';
    btn.style.borderColor = horizontalEnabled ? 'var(--black)' : 'var(--white)';
}

// NEW: Grid button UI
function updateGridButtonUI() {
    const btn = document.getElementById('gridButton');
    if (!btn) return;
    btn.textContent = `Grid: ${gridEnabled ? 'On' : 'Off'}`;
    btn.style.backgroundColor = gridEnabled ? 'var(--white)' : 'var(--black)';
    btn.style.color = gridEnabled ? 'var(--black)' : 'var(--white)';
    btn.style.borderColor = gridEnabled ? 'var(--black)' : 'var(--white)';
}

export function resetGame(arenaWidth, arenaHeight) {
    isPlaying = false;
    gameEnded = false;
    roundWinner = null; // clear last-round winner so new round runs normally

    // Stop any ongoing drag
    draggingPlayer = null;
    dragPointerId = null;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    resetPlayers(arenaWidth, arenaHeight);
    resetVersusUI();
    updatePlayButtonState();
    updateGravityButtonUI();
    updateHorizontalButtonUI();

    if (!animationFrameId) {
        idleLoop();
    }
}

function idleLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // NEW: draw grid when dragging (overlay)
    if (gridEnabled && draggingPlayer) drawDragGrid(ctx, canvas.width, canvas.height);

    players.forEach(player => player.drawWeapon(ctx));
    players.forEach(player => player.draw(ctx));

    // Keep classic UI text refreshed while idle (so current values stay visible)
    updateDamageDisplays();

    if (!isPlaying && !gameEnded) {
        animationFrameId = requestAnimationFrame(idleLoop);
    }
}

function gameLoop() {
    const pauseForShrink = !!(window.arenaSizingControls && typeof window.arenaSizingControls.isShrinkingActive === 'function' && window.arenaSizingControls.isShrinkingActive());
    if (pauseForShrink) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        players.forEach(player => player.drawWeapon(ctx));
        players.forEach(player => player.draw(ctx));
        updateDamageDisplays();
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    if (!isPlaying && gameEnded) {
        const anyFragmentsLeft = players.some(p => !p.isAlive && p.fragments.length > 0);
        if (!anyFragmentsLeft) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            return;
        }
    } else if (!isPlaying && !gameEnded) {
        idleLoop();
        return;
    }

    // Determine simulation steps based on timeScale
    const steps = (isPlaying && !gameEnded) ? timeScale : 1;

    for (let step = 0; step < steps; step++) {
        // If the game ended mid-step (e.g. collision killed someone), stop simulating
        if (gameEnded) break;

        window.gameFrameNumber++; // Increment global frame counter per simulation step

        // Update players (includes poison ticking)
        players.forEach(player => {
            player.update(canvas.width, canvas.height, false, gravityEnabled);
        });

        // NEW: If poison (or any non-collision effect) killed someone in Classic,
        // end the round with the same UI/particles as normal kills.
        if (!gameEnded && currentMode === 'classic' && players[0] && players[1]) {
            const p0Alive = players[0].isAlive;
            const p1Alive = players[1].isAlive;
            if (p0Alive && !p1Alive) {
                gameOver(players[0]);
                break;
            } else if (!p0Alive && p1Alive) {
                gameOver(players[1]);
                break;
            } else if (!p0Alive && !p1Alive) {
                gameOver(null);
                break;
            }
        }

        // Collisions
        if (!gameEnded) {
            if (currentMode === 'ffa' || currentMode === 'teams') {
                for (let i = 0; i < players.length; i++) {
                    for (let j = i + 1; j < players.length; j++) {
                        handleCollision(players[i], players[j], () => {}, players);
                    }
                }
                const alive = players.filter(p => p.isAlive);
                if (alive.length <= 1) {
                    gameOver(alive[0] || null);
                }
            } else if (currentMode === 'boss') {
                for (let i = 0; i < players.length; i++) {
                    for (let j = i + 1; j < players.length; j++) {
                        handleCollision(players[i], players[j], () => {}, players);
                    }
                }
                const boss = players.find(p => p.team === 'red');
                const bluesAlive = players.filter(p => p.team === 'blue' && p.isAlive).length;

                if (!boss || !boss.isAlive) {
                    gameOver(players.find(p => p.team === 'blue' && p.isAlive) || null);
                } else if (bluesAlive === 0) {
                    gameOver(boss);
                }
            } else if (currentMode === 'single') {
                // No collisions
            } else {
                if (players[0] && players[1]) {
                    handleCollision(players[0], players[1], gameOver, players);
                }
            }
        }
    }

    // DRAW ONCE PER REFRESH
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // NEW: draw grid when dragging (overlay)
    if (gridEnabled && draggingPlayer) drawDragGrid(ctx, canvas.width, canvas.height);

    players.forEach(player => player.drawWeapon(ctx));
    players.forEach(player => player.draw(ctx));

    // Refresh classic UI text
    updateDamageDisplays();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// NEW: Keep the damage displays updated live (classic mode)
function updateDamageDisplays() {
    if (currentMode !== 'classic') return;
    const left = document.getElementById('damage-display-left');
    const right = document.getElementById('damage-display-right');
    if (players[0] && left) {
        const txt = players[0].weapon.getDamageDisplayText();
        left.innerHTML = txt;
        left.style.color = players[0].color;
        if (lastDamageTexts[0] !== txt) {
            lastDamageTexts[0] = txt;
            emitSpeechFromDamage(players[0], txt);
        }
    }
    if (players[1] && right) {
        const txt = players[1].weapon.getDamageDisplayText();
        right.innerHTML = txt;
        right.style.color = players[1].color;
        if (lastDamageTexts[1] !== txt) {
            lastDamageTexts[1] = txt;
            emitSpeechFromDamage(players[1], txt);
        }
    }
}

// NEW: parse cues from damage display into short bubbles
function emitSpeechFromDamage(p, txt) {
    if (!txt) return;
    if (txt.includes('BOOM')) { p.say('BOOM!', 60); return; }
    if (txt.includes('BURST SOON')) { p.say('Burst soon!', 50); return; }
    if (txt.includes('CRUSH')) { p.say('Crush!', 45); return; }
    if (txt.includes('Zapping')) { p.say('Zap!', 35); return; }
}

export async function togglePlayPause() {
    await playClickSound();
    if (isPlaying) {
        isPlaying = false;
        // NEW: Pause the shrinking arena if it's running
        if (window.arenaSizingControls && typeof window.arenaSizingControls.pauseShrinking === 'function') {
            window.arenaSizingControls.pauseShrinking();
        }

        playButton.classList.remove('paused');
        updatePlayButtonState();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            if (!gameEnded) {
                idleLoop();
            }
        }
    } else {
        // Guard: FFA and Teams need at least 2 players
        if ((currentMode === 'ffa' || currentMode === 'teams') && players.length < 2) {
            updatePlayButtonState();
            return;
        }
        isPlaying = true;
        // NEW: Resume the shrinking arena if it was paused
        if (window.arenaSizingControls && typeof window.arenaSizingControls.resumeShrinking === 'function') {
            window.arenaSizingControls.resumeShrinking();
        }

        playButton.classList.add('paused');
        updatePlayButtonState();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop();
    }
}

export function setupGame(config) {
    canvas = config.canvas;
    playButton = config.playButton;
    resetButton = config.resetButton;
    gameContainer = config.gameContainer;
    
    ctx = canvas.getContext('2d');
    
    playButton.addEventListener('click', togglePlayPause);
    resetButton.addEventListener('click', async () => {
        await playClickSound();

        // NEW: Reset the arena size fully (including restarting Shrinking)
        if (window.arenaSizingControls && typeof window.arenaSizingControls.resetArenaOnReset === 'function') {
            window.arenaSizingControls.resetArenaOnReset();
        }

        resetGame(canvas.width, canvas.height);
    });

    // NEW: zoom controls
    const zoomInBtn = document.getElementById('zoomInButton');
    const zoomOutBtn = document.getElementById('zoomOutButton');
    if (zoomInBtn && zoomOutBtn) {
        zoomInBtn.addEventListener('click', async () => {
            await playClickSound();
            const current = getCurrentScale();
            applyScale(current + SCALE_STEP);
        });
        zoomOutBtn.addEventListener('click', async () => {
            await playClickSound();
            const current = getCurrentScale();
            applyScale(current - SCALE_STEP);
        });
    }

    // NEW: gravity toggle button
    const gravityBtn = document.getElementById('gravityButton');
    if (gravityBtn) {
        gravityBtn.addEventListener('click', async () => {
            await playClickSound();
            gravityEnabled = !gravityEnabled;
            updateGravityButtonUI();
        });
        updateGravityButtonUI();
    }
    // NEW: horizontal toggle button
    const horizBtn = document.getElementById('horizButton');
    if (horizBtn) {
        horizBtn.addEventListener('click', async () => {
            await playClickSound();
            horizontalEnabled = !horizontalEnabled;
            window.horizontalEnabled = horizontalEnabled;
            updateHorizontalButtonUI();
        });
        updateHorizontalButtonUI();
    }
    // NEW: grid toggle button
    const gridBtn = document.getElementById('gridButton');
    if (gridBtn) {
        gridBtn.addEventListener('click', async () => {
            await playClickSound();
            gridEnabled = !gridEnabled;
            updateGridButtonUI();
        });
        updateGridButtonUI();
    }

    // NEW: speed toggle button
    const speedBtn = document.getElementById('speedButton');
    if (speedBtn) {
        speedBtn.addEventListener('click', async () => {
            await playClickSound();
            // Cycle through 1x, 2x, 5x, 10x
            if (timeScale === 1) timeScale = 2;
            else if (timeScale === 2) timeScale = 5;
            else if (timeScale === 5) timeScale = 10;
            else timeScale = 1;
            speedBtn.textContent = `Speed: ${timeScale}x`;
        });
    }

    // NEW: Pointer-based dragging on the canvas
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', onPointerUp, { passive: false });
    canvas.addEventListener('pointercancel', onPointerUp, { passive: false });
    canvas.addEventListener('pointerleave', (e) => {
        // Only end drag if the same pointer leaves the canvas
        if (dragPointerId === e.pointerId) onPointerUp(e);
    });

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && gameContainer.style.display === 'flex') {
            // Do not toggle play/pause if user is typing in inputs/textareas or inside modals
            const ae = document.activeElement;
            const typingTag = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA');
            const contentEditable = ae && ae.isContentEditable;
            const inCustomizer = document.getElementById('customizer-menu')?.style.display === 'flex'
              && (event.target.closest('#customizer-menu'));
            const inAiMaker = document.getElementById('ai-maker-menu')?.style.display === 'flex'
              && (event.target.closest('#ai-maker-menu'));
            if (typingTag || contentEditable || inCustomizer || inAiMaker) return;

            event.preventDefault();
            togglePlayPause();
        }
    });

    updatePlayButtonState();
    updateGravityButtonUI();
    updateHorizontalButtonUI();
}

/**
 * Hard reset and clear the canvas without re-starting any loops.
 * Leaves the game in a clean, idle, reset state with a clear canvas.
 */
export function resetAndClear(arenaWidth, arenaHeight) {
    isPlaying = false;
    gameEnded = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    resetPlayers(arenaWidth || (canvas ? canvas.width : 0), arenaHeight || (canvas ? canvas.height : 0));

    if (canvas) {
        const h = `${canvas.height}px`;
        const left = document.getElementById('selection-box-left');
        const right = document.getElementById('selection-box-right');
        if (left) left.style.height = h;
        if (right) right.style.height = h;

        const damageWrapper = document.getElementById('damage-info-wrapper');
        if (damageWrapper && currentMode !== 'ffa') {
            damageWrapper.style.width = `${canvas.width + 10}px`;
        }
    }

    if (playButton) {
        playButton.textContent = 'Play';
        playButton.classList.remove('paused');
        updatePlayButtonState();
    }
    updateGravityButtonUI();
    updateHorizontalButtonUI();

    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// NEW: allow main to inform game mode
export function setGameMode(mode) {
    currentMode = mode;

    // Set default gravity per mode:
    if (mode === 'classic') {
        gravityEnabled = true;
    } else {
        gravityEnabled = false;
    }
    updateGravityButtonUI();

    updatePlayButtonState();
}

// NEW: Helpers for dragging
function getCanvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

function findTopmostPlayerAt(x, y) {
    // Iterate from last to first to approximate "topmost" (last drawn)
    for (let i = players.length - 1; i >= 0; i--) {
        const p = players[i];
        if (!p.isAlive) continue;
        const dx = x - p.x;
        const dy = y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= p.radius) return p;
    }
    return null;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function onPointerDown(e) {
    e.preventDefault(); // prevent page scroll/zoom on touch
    // Ignore non-primary buttons (right/middle mouse)
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const { x, y } = getCanvasCoords(e);
    const p = findTopmostPlayerAt(x, y);
    if (p) {
        draggingPlayer = p;
        dragPointerId = e.pointerId;
        canvas.setPointerCapture(dragPointerId);
        // Preserve the player's momentum from BEFORE the drag
        p._preDragVx = p.vx;
        p._preDragVy = p.vy;
        // While dragging, stop the player's motion for stable placement
        p.vx = 0;
        p.vy = 0;
        // NEW: start sampling drag movement for fling velocity
        const now = performance.now();
        p._dragSamples = [{ x, y, t: now }];
    }
}

function onPointerMove(e) {
    if (!draggingPlayer || dragPointerId !== e.pointerId) return;
    e.preventDefault(); // keep drag smooth on touch
    const { x, y } = getCanvasCoords(e);
    // Clamp inside arena bounds with margin = radius
    const r = draggingPlayer.radius;
    draggingPlayer.x = clamp(x, r, canvas.width - r);
    draggingPlayer.y = clamp(y, r, canvas.height - r);
    // Keep velocity zero while dragging
    draggingPlayer.vx = 0;
    draggingPlayer.vy = 0;
    // NEW: record drag sample for fling computation
    const now = performance.now();
    draggingPlayer._dragSamples = (draggingPlayer._dragSamples || []);
    draggingPlayer._dragSamples.push({ x: draggingPlayer.x, y: draggingPlayer.y, t: now });
    // keep only the last ~6 samples
    if (draggingPlayer._dragSamples.length > 6) draggingPlayer._dragSamples.shift();
}

function onPointerUp(e) {
    e.preventDefault(); // prevent stray mouseup/touchend defaults
    if (dragPointerId === e.pointerId) {
        try {
            canvas.releasePointerCapture(dragPointerId);
        } catch {}
        // NEW: compute fling velocity from drag samples (fallback to pre-drag if tiny)
        if (draggingPlayer) {
            const samples = draggingPlayer._dragSamples || [];
            let vx = 0, vy = 0;
            if (samples.length >= 2) {
                const last = samples[samples.length - 1];
                // find an older sample ~80-150ms ago to avoid noise
                const targetAgeMs = 120;
                let older = samples[0];
                for (let i = samples.length - 2; i >= 0; i--) {
                    if (last.t - samples[i].t >= targetAgeMs) { older = samples[i]; break; }
                    older = samples[i];
                }
                const dt = Math.max(1, last.t - older.t); // ms
                const scale = 1000 / 60; // convert px/ms to px/frame
                vx = ((last.x - older.x) / dt) * scale;
                vy = ((last.y - older.y) / dt) * scale;
                // clamp fling speed to sane limits
                const speed = Math.hypot(vx, vy);
                const maxSpeed = 22;
                if (speed > maxSpeed) {
                    const f = maxSpeed / speed; vx *= f; vy *= f;
                }
            }
            // If fling is negligible, restore pre-drag momentum
            if (Math.hypot(vx, vy) < 0.5) {
                if (typeof draggingPlayer._preDragVx === 'number') vx = draggingPlayer._preDragVx;
                if (typeof draggingPlayer._preDragVy === 'number') vy = draggingPlayer._preDragVy;
            }
            draggingPlayer.vx = vx;
            draggingPlayer.vy = vy;
            // cleanup
            delete draggingPlayer._preDragVx;
            delete draggingPlayer._preDragVy;
            delete draggingPlayer._dragSamples;
        }
        dragPointerId = null;
        draggingPlayer = null;
    }
}

// NEW: draw a subtle grid overlay (called only while dragging)
function drawDragGrid(ctx, w, h) {
    const cell = 40;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 1;

    // vertical lines
    for (let x = 0; x <= w; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
    }
    // horizontal lines
    for (let y = 0; y <= h; y += cell) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
    }

    // axes (bolder)
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();

    ctx.restore();
}