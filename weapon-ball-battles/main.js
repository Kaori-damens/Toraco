import { setupAudio, areSoundsReady, playClickSound, playStartupSound } from './audio.js';
import { setupUI, resetSelections } from './ui.js';
import { DEFAULT_ARENA_WIDTH, DEFAULT_ARENA_HEIGHT } from './state.js';
import { setupMenu, cleanupMenu, pauseMenu } from './menu.js';
import { setupGame, resetGame } from './game.js';
// NEW: Import refactored modules
import { setupMenuNavigation } from './menu-navigation.js';
import { setupGamemodeManagement } from './gamemode-management.js';
import { setupArenaSizing } from './arena-sizing.js';
import { setupUIState } from './ui-state.js';
import { ensureFullscreen } from './fullscreen.js'; // NEW: Fullscreen helper
// NEW: Customizer
import { setupCustomizer } from './ui/customizer.js';
import { setupAIMaker } from './ui/ai-maker.js';
import { setupWeaponAbilities } from './weapons/abilities.js';
const canvas = document.getElementById('gameCanvas');
const loadingScreen = document.getElementById('loading-screen');
const loadingScreenText = loadingScreen.querySelector('p');
const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');
const gameTitle = document.getElementById('game-title');
const playButton = document.getElementById('playButton');
const resetButton = document.getElementById('resetButton');
// Add: dismiss the hot banner on click
const hotBanner = document.getElementById('hot-banner');
if (hotBanner) {
    hotBanner.addEventListener('click', () => {
        hotBanner.remove();
    });
}
// Set initial display states
mainMenu.style.opacity = '0';
mainMenu.style.pointerEvents = 'none';
mainMenu.style.display = 'none';
gameContainer.style.display = 'none';
gameContainer.style.opacity = '0';
loadingScreen.style.display = 'flex';
loadingScreen.style.opacity = '1';
// Track whether we've already transitioned past the loading screen
let hasShownMainMenu = false;
// Helper: reveal the main menu (idempotent)
function revealMainMenu() {
    if (hasShownMainMenu) return;
    hasShownMainMenu = true;
    loadingScreen.style.opacity = '0';
    loadingScreen.style.pointerEvents = 'none';
    loadingScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
    requestAnimationFrame(() => {
        mainMenu.style.opacity = '1';
        mainMenu.style.pointerEvents = 'auto';
    });
    setupMenu(mainMenu, gameTitle);
}
// Failsafe: if audio takes too long or a file fails to load, don't block the UI forever.
// After 4 seconds, show the menu anyway and keep loading audio in the background.
const loadingWatchdog = setTimeout(() => {
    if (!hasShownMainMenu) {
        // Let the user start interacting; audio will continue to initialize lazily.
        revealMainMenu();
    }
}, 4000);
document.addEventListener('click', async (event) => {
    // Attempt to enter fullscreen on first user interaction
    ensureFullscreen(); // NEW: best-effort fullscreen entry
    if (!areSoundsReady()) {
        return;
    }
    const target = event.target;
    if (target.closest('.weapon-display')) {
        await playClickSound();
    }
});
function onAudioLoadingStateChange(isLoadingState) {
    if (isLoadingState) {
        loadingScreenText.textContent = 'Loading Game...';
    } else {
        // We reached the end of the audio loading attempt (success or fail).
        // Clear the watchdog since we're handling UI explicitly now.
        clearTimeout(loadingWatchdog);
        // If audio initialized or is at least suspended (will resume on click), proceed.
        if (areSoundsReady()) {
            revealMainMenu();
        } else {
            // Audio failed to fully load; don't block the user behind the loading screen.
            // Show a subtle note, then reveal the menu.
            loadingScreenText.textContent = 'Some audio failed to load. You can still play!';
            loadingScreenText.style.color = '#ffcc00';
            // Small delay so the user can read the note briefly
            setTimeout(() => {
                revealMainMenu();
            }, 500);
        }
    }
}
// Initial Setup
setupUI(() => resetGame(canvas.width, canvas.height));
setupGame({
    canvas,
    playButton,
    resetButton,
    gameContainer
});
// NEW: Setup refactored modules
setupMenuNavigation();
setupGamemodeManagement();
setupArenaSizing();
setupUIState();
setupCustomizer(); // NEW: init custom ball/health maker
setupAIMaker(); // NEW: AI weapon maker + gallery
// Initialize consistent, human-friendly ability text for every weapon class
setupWeaponAbilities();
// ADMIN / April Fools Event
// Code "THISISASECRETDONOTDOTHIS1234567890" unlocks early access; @Flynnwhite bypasses code
window._aprilFools = {
  enabled: false,
  secretCode: 'THISISASECRETDONOTDOTHIS1234567890',
  isUnlockedByAdmin: false
};
// Auto-enable on April 1st (month is 0-indexed: 3 = April)
(function checkApril() {
  try {
    const now = new Date();
    if (now.getMonth() === 3 && now.getDate() === 1) {
      window._aprilFools.enabled = true;
      console.log('April Fools event active!');
    }
  } catch (e) {}
})();
// Expose a small function to toggle wacky settings when event active/unlocked
window.toggleAprilFools = function(enable) {
  window._aprilFools.enabled = !!enable;
  // Apply dynamic runtime tweaks: faster spin and random color shifts for visual wackiness
  const players = window && window.players;
  if (players && Array.isArray(players)) {
    players.forEach(p => {
      if (enable) {
        // store original spin and color if not stored
        if (typeof p._aprilOriginalSpin === 'undefined' && p.weapon) p._aprilOriginalSpin = p.weapon.spinDirection || 1;
        if (typeof p._aprilOriginalColor === 'undefined') p._aprilOriginalColor = p.originalColor || p.color;
        if (p.weapon) p.weapon.spinDirection = (Math.random() > 0.5) ? 3 : -3;
        p.color = `hsl(${Math.floor(Math.random()*360)},80%,60%)`;
      } else {
        if (p.weapon && typeof p._aprilOriginalSpin !== 'undefined') p.weapon.spinDirection = p._aprilOriginalSpin || 1;
        if (typeof p._aprilOriginalColor !== 'undefined') p.color = p._aprilOriginalColor;
      }
    });
  }
};
// Wire up Admin button behavior (hidden by default)
(function setupAdminButton() {
  const btn = document.getElementById('adminButton');
  const modal = document.getElementById('april-settings');
  if (!btn) return;
  // Reveal the button (visibility can be controlled via CSS/JS); leave it visible so admins can click
  btn.style.display = 'inline-block';
  // Helper to open modal and populate current settings
  function openModal() {
    if (!modal) return;
    const enable = document.getElementById('april-enable-all');
    const randc = document.getElementById('april-random-colors');
    const spin = document.getElementById('april-spin-mult');
    // Default defaults if not present
    const s = (window._aprilFools && window._aprilFools.settings) || { randomizeColors: true, spinMult: 3 };
    if (enable) enable.checked = !!window._aprilFools.enabled;
    if (randc) randc.checked = !!s.randomizeColors;
    if (spin) spin.value = s.spinMult || 3;
    modal.style.display = 'flex';
  }
  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
  }
  btn.addEventListener('click', async () => {
    // Prompt for secret or accept username bypass
    let allowed = false;
    try {
      // If global websim user exists and username matches, allow
      if (window.websim && typeof window.websim.getCurrentUser === 'function') {
        const user = await window.websim.getCurrentUser().catch(()=>null);
        if (user && user.username && user.username.toLowerCase() === 'flynnwhite') {
          allowed = true;
        }
      }
    } catch(e) {}
    if (!allowed) {
      const code = prompt('Enter admin code to unlock April Fools features:');
      if (code && code.trim() === window._aprilFools.secretCode) allowed = true;
    }
    if (!allowed) {
      alert('Access denied.');
      return;
    }
    // Mark unlocked and show settings modal
    window._aprilFools.isUnlockedByAdmin = true;
    openModal();
  });
  // Modal wiring: apply / close
  if (modal) {
    const applyBtn = document.getElementById('april-apply');
    const closeBtn = document.getElementById('april-close');
    applyBtn?.addEventListener('click', async () => {
      await playClickSound();
      const enable = document.getElementById('april-enable-all').checked;
      const randomizeColors = document.getElementById('april-random-colors').checked;
      const spinMult = parseFloat(document.getElementById('april-spin-mult').value) || 1;
      // store settings
      window._aprilFools.settings = { randomizeColors: !!randomizeColors, spinMult: spinMult };
      // Toggle main wacky mode
      window.toggleAprilFools(enable);
      // Additional runtime application: spin multiplier / color randomization across all players
      try {
        const players = window.players || [];
        players.forEach(p => {
          // store originals for restore
          if (typeof p._aprilOriginalSpin === 'undefined' && p.weapon) p._aprilOriginalSpin = p.weapon.spinDirection || 1;
          if (typeof p._aprilOriginalColor === 'undefined') p._aprilOriginalColor = p.originalColor || p.color;
          if (enable) {
            // multiply spinDirection by spinMult (preserve sign)
            if (p.weapon && typeof p.weapon.spinDirection === 'number') {
              const sign = Math.sign(p.weapon.spinDirection) || 1;
              p.weapon.spinDirection = sign * Math.abs(p._aprilOriginalSpin || 1) * spinMult;
            }
            if (randomizeColors) {
              p.color = `hsl(${Math.floor(Math.random()*360)},80%,60%)`;
            }
          } else {
            // restore originals
            if (p.weapon && typeof p._aprilOriginalSpin !== 'undefined') p.weapon.spinDirection = p._aprilOriginalSpin;
            if (typeof p._aprilOriginalColor !== 'undefined') p.color = p._aprilOriginalColor;
          }
        });
      } catch (e) {
        console.warn('Applying April settings failed:', e);
      }
      alert('April Fools settings applied.');
      closeModal();
    });
    closeBtn?.addEventListener('click', async () => {
      await playClickSound();
      closeModal();
    });
    // close modal when clicking backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
})();
setupAudio(onAudioLoadingStateChange);
/* NEW: Global unhandled rejection handler to prevent crashes and show a friendly note.
   Avoids duplicate toasts if another handler already processed the event. */
window.addEventListener('unhandledrejection', (event) => {
    // If some earlier handler already handled this rejection, do nothing.
    if (event.defaultPrevented) return;
    const reason = event.reason || {};
    const msg = (typeof reason === 'string') ? reason : (reason.message || String(reason || ''));
    const timeoutMatch = /Request timed out(?: for requestId ([\w-]+))?/i.exec(msg);
    const reqId = timeoutMatch && timeoutMatch[1] ? timeoutMatch[1] : null;
    // Only display our friendly toast for timeout-like messages; otherwise let other handlers/loggers decide.
    if (!/Request timed out/i.test(msg)) return;
    // Prevent other handlers from also processing this event
    try { event.preventDefault(); } catch (e) {}
    // De-duplicate existing toast
    if (document.getElementById('global-error-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'global-error-toast';
    toast.textContent = reqId
      ? `Network request timed out (id: ${reqId}). Please try again.`
      : 'A network request took too long. Please try again.';
    toast.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:8px 12px;border-radius:8px;border:2px solid #fff;font-family:Anton,sans-serif;z-index:200;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
});
