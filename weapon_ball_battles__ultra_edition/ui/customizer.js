// Customizer UI: apply custom color/radius ("ball maker") and health ("health maker")
import { players } from '../state.js';
import { getCurrentGamemode } from '../gamemode-management.js';
import { playClickSound } from '../audio.js';
import { Basic, } from '../weapon.js';
import { Sword, Dagger, Spear, Unarmed, Bow, Shuriken, Scythe, Crusher, Grower, Shrinker, Axe, Staff, SpeedBall, Duplicator, DummyBall } from '../weapon.js';

// Helper: update classic damage display text/colors
function refreshClassicDisplays() {
  const left = document.getElementById('damage-display-left');
  const right = document.getElementById('damage-display-right');
  if (players[0] && left) {
    left.innerHTML = players[0].weapon.getDamageDisplayText();
    left.style.color = players[0].color;
  }
  if (players[1] && right) {
    right.innerHTML = players[1].weapon.getDamageDisplayText();
    right.style.color = players[1].color;
  }
}

// Helper: parse any CSS color to rgb numbers
function parseColorToRgb(colorStr) {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const ctx = c.getContext('2d');
  try {
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b };
  } catch {
    return null;
  }
}

/* Add missing helper to avoid ReferenceError when opening the customizer */
function scrollSaveIntoView() {
  const card = document.getElementById('customizer-card');
  if (card) {
    // Scroll to bottom to ensure action buttons are visible on small screens
    card.scrollTop = card.scrollHeight;
  }
}

function getTargets(mode, manualTarget) {
  const list = [];
  if (manualTarget && manualTarget !== 'auto') {
    if (manualTarget === 'left' && players[0]) list.push(players[0]);
    else if (manualTarget === 'right' && players[1]) list.push(players[1]);
    else if (manualTarget === 'blue') players.forEach(p => { if (p.team === 'blue') list.push(p); });
    else if (manualTarget === 'red') players.forEach(p => { if (p.team === 'red') list.push(p); });
    else if (manualTarget === 'all') players.forEach(p => list.push(p));
    return list;
  }

  // Auto target by mode
  if (mode === 'classic') {
    if (players[0]) list.push(players[0]);
    if (players[1]) list.push(players[1]);
  } else if (mode === 'teams') {
    players.forEach(p => list.push(p));
  } else if (mode === 'boss') {
    // Boss mode: prefer blue team by default (co-op squad)
    players.forEach(p => { if (p.team === 'blue') list.push(p); });
  } else if (mode === 'ffa') {
    players.forEach(p => list.push(p));
  }
  return list;
}

// NEW: Simple custom weapon storage
function loadCustomWeapons() {
  try {
    const raw = localStorage.getItem('customWeapons');
    const arr = raw ? JSON.parse(raw) : [];
    if (!window.customWeaponRegistry) window.customWeaponRegistry = {};
    arr.forEach(def => { window.customWeaponRegistry[def.name] = def; });
    return arr;
  } catch { return []; }
}
function saveCustomWeapons(arr) {
  localStorage.setItem('customWeapons', JSON.stringify(arr));
}

export async function setupCustomizer() {
  const openBtn = document.getElementById('customizeButton');
  const modal = document.getElementById('customizer-menu');
  const closeBtn = document.getElementById('customizer-close');

  const targetSel = document.getElementById('custom-target');
  const colorInput = document.getElementById('custom-color');
  const radiusInput = document.getElementById('custom-radius');
  const healthInput = document.getElementById('custom-health');
  const applyBallBtn = document.getElementById('apply-ball-btn');
  const applyHealthBtn = document.getElementById('apply-health-btn');

  // NEW: Remove old maker UI: do not create makerWrap or save button here anymore.

  // Populate standard weapons + any loaded customs into dropdown (if present)
  const weaponSelect = document.getElementById('custom-weapon');
  function repopulateWeaponDropdown() {
    if (!weaponSelect) return;
    const standard = [
      { value: 'basic', label: 'Basic' }, { value: 'sword', label: 'Sword' },
      { value: 'dagger', label: 'Dagger' }, { value: 'spear', label: 'Spear' },
      { value: 'bow', label: 'Bow' }, { value: 'scythe', label: 'Scythe' },
      { value: 'axe', label: 'Axe' }, { value: 'crusher', label: 'Crusher' },
      { value: 'grower', label: 'Grower' }, { value: 'shrinker', label: 'Shrinker' },
      { value: 'staff', label: 'Staff' }, { value: 'shuriken', label: 'Shuriken' },
      { value: 'speedball', label: 'SpeedBall' }, { value: 'duplicator', label: 'Duplicator' },
      { value: 'dummyball', label: 'Dummy Ball' },
      { value: 'ak47', label: 'AK-47' }, { value: 'france', label: 'France' }, { value: 'italy', label: 'Italy' }, { value: 'germany', label: 'Germany' }
    ];
    while (weaponSelect.firstChild) weaponSelect.removeChild(weaponSelect.firstChild);
    standard.forEach(s => {
      const opt = document.createElement('option'); opt.value = s.value; opt.textContent = s.label; weaponSelect.appendChild(opt);
    });
    if (window.customWeaponRegistry) {
      const group = document.createElement('optgroup');
      group.label = 'Custom';
      Object.keys(window.customWeaponRegistry).forEach(name => {
        const opt = document.createElement('option');
        opt.value = 'custom:' + name; opt.textContent = 'Custom: ' + name; group.appendChild(opt);
      });
      weaponSelect.appendChild(group);
    }
  }
  repopulateWeaponDropdown();

  // Listen for registry changes from AI Maker to refresh options
  window.addEventListener('custom-weapons:updated', () => {
    repopulateWeaponDropdown();
  });

  if (!openBtn || !modal) return;

  openBtn.addEventListener('click', async () => {
    await playClickSound();
    modal.style.display = 'flex';
    scrollSaveIntoView(); // NEW: ensure Save button is visible when opening
  });
  if (closeBtn) closeBtn.addEventListener('click', async () => {
    await playClickSound();
    modal.style.display = 'none';
  });
  // Close by clicking backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // NEW: Weapon Fuser UI
  const card = document.getElementById('customizer-card');
  if (card) {
    const fuseWrap = document.createElement('div');
    fuseWrap.className = 'customizer-row';
    fuseWrap.style.flexDirection = 'column';
    fuseWrap.style.alignItems = 'stretch';
    fuseWrap.style.gap = '6px';
    fuseWrap.innerHTML = `
      <hr />
      <div class="customizer-row" style="margin-top:4px;">
        <label style="min-width:90px;">Fuse</label>
        <span style="font-size:12px;">Pick two weapons to fuse</span>
      </div>
      <div class="customizer-row">
        <label for="fuse-a">Weapon A</label>
        <select id="fuse-a"></select>
      </div>
      <div class="customizer-row">
        <label for="fuse-b">Weapon B</label>
        <select id="fuse-b"></select>
      </div>
      <div class="customizer-actions">
        <button id="apply-fuse-btn" title="Apply fused weapon to target(s)">Apply Fuse</button>
      </div>
    `;
    // Insert before the Color section (just before the first <hr /> that precedes Color)
    const firstHr = Array.from(card.querySelectorAll('hr'))[0];
    if (firstHr) {
      card.insertBefore(fuseWrap, firstHr);
    } else {
      card.appendChild(fuseWrap);
    }

    // Populate fuse selects with standard set (exclude 'fuse' and 'custom')
    const fuseOptions = [
      { value: 'basic', label: 'Basic' }, { value: 'sword', label: 'Sword' },
      { value: 'dagger', label: 'Dagger' }, { value: 'spear', label: 'Spear' },
      { value: 'bow', label: 'Bow' }, { value: 'scythe', label: 'Scythe' },
      { value: 'axe', label: 'Axe' }, { value: 'crusher', label: 'Crusher' },
      { value: 'grower', label: 'Grower' }, { value: 'shrinker', label: 'Shrinker' },
      { value: 'staff', label: 'Staff' }, { value: 'shuriken', label: 'Shuriken' },
      { value: 'speedball', label: 'SpeedBall' }, { value: 'duplicator', label: 'Duplicator' },
      { value: 'dummyball', label: 'Dummy Ball' }, { value: 'ak47', label: 'AK-47' }, { value: 'france', label: 'France' }, { value: 'italy', label: 'Italy' }, { value: 'germany', label: 'Germany' }
    ];
    function fillSelect(sel) {
      sel.innerHTML = '';
      fuseOptions.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value; o.textContent = opt.label;
        sel.appendChild(o);
      });
    }
    const selA = fuseWrap.querySelector('#fuse-a');
    const selB = fuseWrap.querySelector('#fuse-b');
    if (selA && selB) { fillSelect(selA); fillSelect(selB); }

    const applyFuseBtn = fuseWrap.querySelector('#apply-fuse-btn');
    if (applyFuseBtn) {
      applyFuseBtn.addEventListener('click', async () => {
        await playClickSound();
        const mode = getCurrentGamemode();
        const manualTarget = targetSel ? targetSel.value : 'auto';
        const targets = getTargets(mode, manualTarget);
        const a = selA ? String(selA.value) : 'sword';
        const b = selB ? String(selB.value) : 'bow';
        const typeStr = `fuse:${a}+${b}`;
        for (const p of targets) {
          if (!p || !p.isAlive) continue;
          p.setWeapon(typeStr, p.color);
        }
        if (mode === 'classic') refreshClassicDisplays();
        scrollSaveIntoView();
      });
    }
  }

  // Wire up single-weapon apply
  const applyWeaponBtn = document.getElementById('apply-weapon-btn');
  if (applyWeaponBtn) {
    applyWeaponBtn.addEventListener('click', async () => {
      await playClickSound();
      const mode = getCurrentGamemode();
      const manualTarget = targetSel ? targetSel.value : 'auto';
      const targets = getTargets(mode, manualTarget);

      const sel = weaponSelect ? String(weaponSelect.value) : 'basic';
      for (const p of targets) {
        if (!p || !p.isAlive) continue;
        // Support custom weapons via "custom:Name" and plain weapon types
        if (sel.startsWith('custom:')) {
          p.setWeapon(sel, p.color);
        } else {
          p.setWeapon(sel, p.color);
        }
      }
      if (mode === 'classic') refreshClassicDisplays();
      scrollSaveIntoView();
    });
  }

  if (applyBallBtn) {
    applyBallBtn.addEventListener('click', async () => {
      await playClickSound();
      const mode = getCurrentGamemode();
      const manualTarget = targetSel ? targetSel.value : 'auto';
      const targets = getTargets(mode, manualTarget);

      const colorVal = (colorInput && colorInput.value.trim()) || '';
      const radiusVal = radiusInput && radiusInput.value ? parseFloat(radiusInput.value) : NaN;

      for (const p of targets) {
        if (!p || !p.isAlive) continue;
        // Apply color if provided
        if (colorVal) {
          const parsed = parseColorToRgb(colorVal);
          if (parsed) {
            p.color = colorVal;
            p.originalColor = colorVal;
            p.originalColorRgb = parsed;
          }
        }
        // Apply radius if valid
        if (!isNaN(radiusVal)) {
          const r = Math.max(10, Math.min(200, radiusVal));
          p.radius = r;
          p.mass = r * r;
          // Let weapons adjust speed if they want; otherwise keep current speed
        }
      }

      if (mode === 'classic') refreshClassicDisplays();
    });
  }

  if (applyHealthBtn) {
    applyHealthBtn.addEventListener('click', async () => {
      await playClickSound();
      const mode = getCurrentGamemode();
      const manualTarget = targetSel ? targetSel.value : 'auto';
      const targets = getTargets(mode, manualTarget);

      const healthVal = healthInput && healthInput.value ? parseFloat(healthInput.value) : NaN;
      if (isNaN(healthVal)) return;

      const clamped = Math.max(1, Math.min(100000, Math.floor(healthVal)));
      for (const p of targets) {
        if (!p) continue;
        p.health = clamped;
        if (!p.isAlive && clamped > 0) {
          // Revive if previously dead
          p.isAlive = true;
          p.fragments = [];
        }
      }
      if (mode === 'classic') refreshClassicDisplays();
    });
  }
}