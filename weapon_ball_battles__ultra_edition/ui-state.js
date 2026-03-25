import { playClickSound } from './audio.js';
import { getCurrentGamemode } from './gamemode-management.js';

let uiHidden = false;

export function setupUIState() {
    const hideUIButton = document.getElementById('hideUIButton');
    // NEW: Get customizer button
    const customizeButton = document.getElementById('customizeButton');
    const horizButton = document.getElementById('horizButton');
    // NEW: grid button reference
    const gridButton = document.getElementById('gridButton');

    hideUIButton.addEventListener('click', async () => {
        await playClickSound();
        uiHidden = !uiHidden;
        const selectionBoxLeft = document.getElementById('selection-box-left');
        const selectionBoxRight = document.getElementById('selection-box-right');
        const playBtn = document.getElementById('playButton');
        const resetBtn = document.getElementById('resetButton');
        const gamemodesBtn = document.getElementById('gamemodesButton');
        const gravityBtn = document.getElementById('gravityButton');
        const zoomControls = document.getElementById('zoom-controls'); // NEW: Zoom controls container
        
        const speedBtn = document.getElementById('speedButton');
        const currentGamemode = getCurrentGamemode();

        if (uiHidden) {
            // Always hide both sidebars when hiding UI (including Boss mode)
            selectionBoxLeft.style.display = 'none';
            selectionBoxRight.style.display = 'none';

            playBtn.style.display = 'none';
            resetBtn.style.display = 'none';
            gamemodesBtn.style.display = 'none';
            if (gravityBtn) gravityBtn.style.display = 'none';
            if (zoomControls) zoomControls.style.display = 'none';
            if (customizeButton) customizeButton.style.display = 'none'; 
            if (horizButton) horizButton.style.display = 'none';
            if (speedBtn) speedBtn.style.display = 'none';
            if (gridButton) gridButton.style.display = 'none';
            hideUIButton.textContent = 'Show UI';
        } else {
            // Show everything back, INCLUDING the Boss sidebar in Boss mode
            selectionBoxLeft.style.display = 'flex';
            if (currentGamemode === 'boss' || currentGamemode === 'teams' || currentGamemode === 'classic') {
                selectionBoxRight.style.display = 'flex';
            } else {
                // In FFA we keep the right sidebar hidden
                selectionBoxRight.style.display = 'none';
            }

            playBtn.style.display = '';
            resetBtn.style.display = '';
            gamemodesBtn.style.display = '';
            if (gravityBtn) gravityBtn.style.display = '';
            if (zoomControls) zoomControls.style.display = 'flex';
            if (customizeButton) customizeButton.style.display = ''; 
            if (horizButton) horizButton.style.display = '';
            if (speedBtn) speedBtn.style.display = '';
            if (gridButton) gridButton.style.display = '';
            hideUIButton.textContent = 'Hide UI';
        }
    });
}

export function syncSidePanelsToCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const h = `${canvas.height}px`;
    const left = document.getElementById('selection-box-left');
    const right = document.getElementById('selection-box-right');
    if (left) left.style.height = h;
    if (right) right.style.height = h;

    const damageWrapper = document.getElementById('damage-info-wrapper');
    if (damageWrapper) {
        damageWrapper.style.width = `${canvas.width + 10}px`;
    }
}