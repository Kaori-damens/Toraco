import { DEFAULT_ARENA_WIDTH, DEFAULT_ARENA_HEIGHT } from './state.js';
import { playClickSound } from './audio.js';
import { resetGame } from './game.js';
import { getCurrentGamemode } from './gamemode-management.js';
import { syncSidePanelsToCanvas } from './ui-state.js';

import { ARENA_SIZES, HOLD_MS, TRANSITION_MS } from './arena/arena-constants.js';
import { applyArenaSizeClasses, updateControlsSpacing, updateUIForCanvas } from './arena/arena-ui.js';
import { createShrinkingController } from './arena/arena-shrinker.js';
import { clampPlayersToCanvas } from './arena/arena-utils.js';

let currentArenaSelection = 'medium'; 
let shrinkingController = null;
let shrinkingPending = false;

if (!window.arenaSizingControls) window.arenaSizingControls = {};
window.arenaSizingControls.isShrinkingActive = () =>
  !!(shrinkingController && shrinkingController.isActive && shrinkingController.isActive());
window.arenaSizingControls._setShrinkingActive = () => { /* no-op: managed internally in the controller now */ };
window.arenaSizingControls._isShrinkingPending = () => shrinkingPending;

export function setupArenaSizing() {
  const smallArenaBtn = document.getElementById('small-arena-btn');
  const mediumArenaBtn = document.getElementById('medium-arena-btn');
  const largeArenaBtn = document.getElementById('large-arena-btn');
  const hugeArenaBtn = document.getElementById('huge-arena-btn');
  const shrinkingArenaBtn = document.getElementById('shrinking-arena-btn');

  const smallArenaBtnFFA = document.getElementById('small-arena-btn-ffa');
  const mediumArenaBtnFFA = document.getElementById('medium-arena-btn-ffa');
  const largeArenaBtnFFA = document.getElementById('large-arena-btn-ffa');
  const hugeArenaBtnFFA = document.getElementById('huge-arena-btn-ffa');
  const shrinkingArenaBtnFFA = document.getElementById('shrinking-arena-btn-ffa');

  const smallArenaBtnTeams = document.getElementById('small-arena-btn-teams');
  const mediumArenaBtnTeams = document.getElementById('medium-arena-btn-teams');
  const largeArenaBtnTeams = document.getElementById('large-arena-btn-teams');
  const hugeArenaBtnTeams = document.getElementById('huge-arena-btn-teams');
  const shrinkingArenaBtnTeams = document.getElementById('shrinking-arena-btn-teams');

  const largeArenaBtnBoss = document.getElementById('large-arena-btn-boss');
  const hugeArenaBtnBoss = document.getElementById('huge-arena-btn-boss');

  // NEW: Single mode buttons
  const smallArenaBtnSingle = document.getElementById('small-arena-btn-single');
  const mediumArenaBtnSingle = document.getElementById('medium-arena-btn-single');
  const largeArenaBtnSingle = document.getElementById('large-arena-btn-single');
  const hugeArenaBtnSingle = document.getElementById('huge-arena-btn-single');

  const tinyArenaBtn = document.getElementById('tiny-arena-btn');
  const tinyArenaBtnFFA = document.getElementById('tiny-arena-btn-ffa');
  const tinyArenaBtnTeams = document.getElementById('tiny-arena-btn-teams');
  const tinyArenaBtnSingle = document.getElementById('tiny-arena-btn-single');

  smallArenaBtn.addEventListener('click', () => startGameWithArenaSize('small'));
  mediumArenaBtn.addEventListener('click', () => startGameWithArenaSize('medium'));
  largeArenaBtn.addEventListener('click', () => startGameWithArenaSize('large'));
  hugeArenaBtn.addEventListener('click', () => startGameWithArenaSize('huge'));
  if (shrinkingArenaBtn) shrinkingArenaBtn.addEventListener('click', () => startGameWithArenaSize('shrinking'));

  smallArenaBtnFFA.addEventListener('click', () => startGameWithArenaSize('small'));
  mediumArenaBtnFFA.addEventListener('click', () => startGameWithArenaSize('medium'));
  largeArenaBtnFFA.addEventListener('click', () => startGameWithArenaSize('large'));
  hugeArenaBtnFFA.addEventListener('click', () => startGameWithArenaSize('huge'));
  if (shrinkingArenaBtnFFA) shrinkingArenaBtnFFA.addEventListener('click', () => startGameWithArenaSize('shrinking'));

  smallArenaBtnTeams.addEventListener('click', () => startGameWithArenaSize('small'));
  mediumArenaBtnTeams.addEventListener('click', () => startGameWithArenaSize('medium'));
  largeArenaBtnTeams.addEventListener('click', () => startGameWithArenaSize('large'));
  hugeArenaBtnTeams.addEventListener('click', () => startGameWithArenaSize('huge'));
  if (shrinkingArenaBtnTeams) shrinkingArenaBtnTeams.addEventListener('click', () => startGameWithArenaSize('shrinking'));

  if (largeArenaBtnBoss) largeArenaBtnBoss.addEventListener('click', () => startGameWithArenaSize('large'));
  if (hugeArenaBtnBoss) hugeArenaBtnBoss.addEventListener('click', () => startGameWithArenaSize('huge'));

  // NEW: Single mode listeners
  if (smallArenaBtnSingle) smallArenaBtnSingle.addEventListener('click', () => startGameWithArenaSize('small'));
  if (mediumArenaBtnSingle) mediumArenaBtnSingle.addEventListener('click', () => startGameWithArenaSize('medium'));
  if (largeArenaBtnSingle) largeArenaBtnSingle.addEventListener('click', () => startGameWithArenaSize('large'));
  if (hugeArenaBtnSingle) hugeArenaBtnSingle.addEventListener('click', () => startGameWithArenaSize('huge'));

  if (tinyArenaBtn) tinyArenaBtn.addEventListener('click', () => startGameWithArenaSize('tiny'));
  if (tinyArenaBtnFFA) tinyArenaBtnFFA.addEventListener('click', () => startGameWithArenaSize('tiny'));
  if (tinyArenaBtnTeams) tinyArenaBtnTeams.addEventListener('click', () => startGameWithArenaSize('tiny'));
  if (tinyArenaBtnSingle) tinyArenaBtnSingle.addEventListener('click', () => startGameWithArenaSize('tiny'));

  async function startGameWithArenaSize(size) {
    await playClickSound();

    const mode = getCurrentGamemode();
    if (mode === 'boss' && (size === 'small' || size === 'medium' || size === 'shrinking')) {
      size = 'large';
    }

    currentArenaSelection = size;

    if (size !== 'shrinking' && shrinkingController) {
      shrinkingController.cancel();
      shrinkingController = null;
      shrinkingPending = false;
    }

    const { w: newWidth, h: newHeight } =
      size === 'tiny' ? ARENA_SIZES.TINY :
      size === 'small' ? ARENA_SIZES.SMALL :
      size === 'large' ? ARENA_SIZES.LARGE :
      size === 'huge' ? ARENA_SIZES.HUGE :
      size === 'shrinking' ? ARENA_SIZES.HUGE :
      ARENA_SIZES.MEDIUM;

    const gamemodesMenu = document.getElementById('gamemodes-menu');
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('gameCanvas');

    applyArenaSizeClasses(gameContainer, size);

    gamemodesMenu.style.display = 'none';
    gamemodesMenu.style.opacity = '0';
    gamemodesMenu.style.pointerEvents = 'none';

    canvas.width = newWidth;
    canvas.height = newHeight;
    clampPlayersToCanvas(newWidth, newHeight);

    syncSidePanelsToCanvas();
    updateControlsSpacing(newHeight);
    updateUIForCanvas(newWidth, newHeight);

    const currentGamemode = getCurrentGamemode();

    resetGame(newWidth, newHeight);

    if (currentGamemode === 'ffa' || currentGamemode === 'teams' || currentGamemode === 'boss') {
      const damageInfoWrapper = document.getElementById('damage-info-wrapper');
      if (damageInfoWrapper) {
        damageInfoWrapper.style.left = `${newWidth + 1}px`;
        damageInfoWrapper.style.height = `${newHeight}px`;
        damageInfoWrapper.style.width = `${newWidth + 10}px`;
      }
    }

    collapseAllSizePanels();

    gameContainer.style.display = 'flex';
    gameContainer.style.opacity = '1';

    if (size === 'shrinking') {
      if (mode === 'boss') return;
      if (shrinkingController) {
        shrinkingController.cancel();
        shrinkingController = null;
      }
      shrinkingPending = true;
    }
  }

  window.arenaSizingControls.getSelection = () => currentArenaSelection;
  window.arenaSizingControls.pauseShrinking = () => {
    if (shrinkingController) shrinkingController.pause();
  };
  window.arenaSizingControls.resumeShrinking = () => {
    if (shrinkingController) {
      shrinkingController.resume();
      return;
    }
    if (currentArenaSelection === 'shrinking' && shrinkingPending) {
      const canvas = document.getElementById('gameCanvas');
      const gameContainer = document.getElementById('game-container');
      shrinkingController = createShrinkingController({
        canvas,
        gameContainer,
        onProgressUpdate: (curW, curH) => {
          clampPlayersToCanvas(curW, curH);
          syncSidePanelsToCanvas();
          updateControlsSpacing(curH);
          updateUIForCanvas(curW, curH);
          const DAMAGE_WRAP = document.getElementById('damage-info-wrapper');
          if (DAMAGE_WRAP) {
            DAMAGE_WRAP.style.height = `${curH}px`;
            DAMAGE_WRAP.style.width = `${curW + 10}px`;
            if (getComputedStyle(DAMAGE_WRAP).position !== 'relative') {
              DAMAGE_WRAP.style.left = `${curW + 1}px`;
            }
          }
        }
      });
      shrinkingController.start();
      shrinkingPending = false;
    }
  };
  window.arenaSizingControls.resetArenaOnReset = () => {
    const canvas = document.getElementById('gameCanvas');
    const gameContainer = document.getElementById('game-container');

    if (shrinkingController) {
      shrinkingController.cancel();
      shrinkingController = null;
    }

    let target = ARENA_SIZES.MEDIUM;
    let label = 'medium';
    if (currentArenaSelection === 'tiny') { target = ARENA_SIZES.TINY; label = 'tiny'; }
    else if (currentArenaSelection === 'small') { target = ARENA_SIZES.SMALL; label = 'small'; }
    else if (currentArenaSelection === 'medium') { target = ARENA_SIZES.MEDIUM; label = 'medium'; }
    else if (currentArenaSelection === 'large') { target = ARENA_SIZES.LARGE; label = 'large'; }
    else if (currentArenaSelection === 'huge') { target = ARENA_SIZES.HUGE; label = 'huge'; }
    else if (currentArenaSelection === 'shrinking') {
      target = ARENA_SIZES.HUGE; label = 'shrinking'; shrinkingPending = true;
    }

    canvas.width = target.w;
    canvas.height = target.h;
    clampPlayersToCanvas(target.w, target.h);

    applyArenaSizeClasses(gameContainer, label);
    syncSidePanelsToCanvas();
    updateControlsSpacing(target.h);
    updateUIForCanvas(target.w, target.h);
  };
}

export function collapseAllSizePanels() {
  const arenaSizeSelection = document.getElementById('arena-size-selection');
  const arenaSizeSelectionFFA = document.getElementById('arena-size-selection-ffa');
  const arenaSizeSelectionTeams = document.getElementById('arena-size-selection-teams');
  const arenaSizeSelectionBoss = document.getElementById('arena-size-selection-boss'); 
  const arenaSizeSelectionSingle = document.getElementById('arena-size-selection-single'); // NEW

  arenaSizeSelection.classList.remove('expanded');
  arenaSizeSelectionFFA.classList.remove('expanded');
  arenaSizeSelectionTeams.classList.remove('expanded');
  if (arenaSizeSelectionBoss) arenaSizeSelectionBoss.classList.remove('expanded');
  if (arenaSizeSelectionSingle) arenaSizeSelectionSingle.classList.remove('expanded');
}