import { WebsimSocket } from '@websim/websim-socket';
import { players } from '../state.js';
import { getCurrentGamemode } from '../gamemode-management.js';
import { playClickSound } from '../audio.js';

const room = new WebsimSocket();

function getTargets(mode) {
  const list = [];
  if (mode === 'classic') {
    if (players[0]) list.push(players[0]);
    if (players[1]) list.push(players[1]);
  } else {
    players.forEach(p => list.push(p));
  }
  return list;
}

async function generateDefinition(name, archetype, prompt) {
  const system = `You output a JSON object for a CustomWeapon in this schema.
Respond ONLY with JSON and no extra text.
{
  "name": string,
  "archetype": "melee" | "projectile",
  "color": string,
  "damage": number,
  "bladeLength": number,
  "spinSpeed": number,
  "reverseOnHit": boolean,
  "grantsImmunity": boolean,
  "attackerStun": number,
  "defenderStun": number,
  "projectileSize": number,
  "shotsPerSecond": number,
  "projectileSpeed": number,
  "bounces": number,
  "projectileLifetime": number
}
Rules:
- Always fill all fields; if not applicable, set sensible defaults.
- Clamp values: damage 0.5..10; bladeLength 40..200; spinSpeed 0..3;
  attackerStun/defenderStun 0..120; projectileSize 8..80; shotsPerSecond 0.1..20;
  projectileSpeed 4..40; bounces 0..10; projectileLifetime 10..1200.
- If the prompt implies shooting, prefer "projectile"; if spinning/close-range, prefer "melee".`;
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: [
      { type: 'text', text: `Name: ${name}\nArchetype: ${archetype}\nBehavior: ${prompt}\nPlease pick reasonable defaults and clamp to safe values.`}
    ]}
  ];
  // Increased timeouts for more reliability during heavy server load
  const withTimeout = (p, ms = 45000) => Promise.race([
    p, new Promise((_, rej) => setTimeout(() => rej(new Error('AI request timed out')), ms))
  ]);
  
  if (typeof websim === 'undefined') throw new Error('Websim SDK not available');

  let hints = {};
  try {
    hints = await withTimeout(normalizeRequest(name, archetype, prompt), 20000);
  } catch {}
  
  const completion = await withTimeout(websim.chat.completions.create({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: [
        { type: 'text', text: `Name: ${name}\nArchetype (user): ${archetype}\nBehavior: ${prompt}\nHINTS: ${JSON.stringify(hints)}` }
      ] }
    ],
    json: true
  })).catch((e) => {
    throw e;
  });
  let def = {};
  try { def = JSON.parse(completion.content); } catch { def = {}; }
  // Merge with hints as fallback
  def.name = name || def.name || 'Custom';
  def.archetype = (def.archetype || hints.archetype || archetype || 'melee').toLowerCase();
  def.color = def.color || hints.color || '#999999';
  def.damage = Math.max(0.5, Math.min(10, Number(def.damage || hints.damage || 1)));
  if (def.archetype === 'melee') {
    def.bladeLength = Math.max(40, Math.min(200, Number(def.bladeLength || hints.bladeLength || 100)));
    def.spinSpeed = Math.max(0, Math.min(3, Number(def.spinSpeed || hints.spinSpeed || 0.1)));
    def.reverseOnHit = !!(def.reverseOnHit ?? hints.reverseOnHit ?? false);
    def.grantsImmunity = !!(def.grantsImmunity ?? hints.grantsImmunity ?? false);
    def.attackerStun = Math.max(0, Math.min(120, Number(def.attackerStun || hints.attackerStun || 6)));
    def.defenderStun = Math.max(0, Math.min(120, Number(def.defenderStun || hints.defenderStun || 6)));
  } else {
    def.projectileSize = Math.max(8, Math.min(80, Number(def.projectileSize || hints.projectileSize || 16)));
    def.shotsPerSecond = Math.max(0.1, Math.min(20, Number(def.shotsPerSecond || hints.shotsPerSecond || 1)));
    def.projectileSpeed = Math.max(4, Math.min(40, Number(def.projectileSpeed || hints.projectileSpeed || 10)));
    def.bounces = Math.max(0, Math.min(10, Number(def.bounces || hints.bounces || 0)));
    def.projectileLifetime = Math.max(10, Math.min(1200, Number(def.projectileLifetime || hints.projectileLifetime || 120)));
  }
  return def;
}

async function normalizeRequest(name, archetype, prompt) {
  const sys = `Respond ONLY with JSON. Infer missing fields from plain English.
Schema:
{
  "archetype": "melee" | "projectile",
  "color": string,
  "damage": number,
  "bladeLength": number,
  "spinSpeed": number,
  "reverseOnHit": boolean,
  "grantsImmunity": boolean,
  "attackerStun": number,
  "defenderStun": number,
  "projectileSize": number,
  "shotsPerSecond": number,
  "projectileSpeed": number,
  "bounces": number,
  "projectileLifetime": number
}`;
  const msg = [
    { role: 'system', content: sys },
    { role: 'user', content: [ { type: 'text', text: `Name: ${name}\nArchetype (user): ${archetype}\nBehavior: ${prompt}` } ] }
  ];
  try {
    const c = await websim.chat.completions.create({ messages: msg, json: true });
    return JSON.parse(c.content || '{}');
  } catch { return {}; }
}

async function generateImage(name, archetype, prompt) {
  const artPrompt = `pixel art icon, 8-bit style, ${archetype} weapon: ${name}. ${prompt}. Transparent background, crisp edges, single object, centered.`;
  // Image generation can be slow, giving it 60 seconds.
  const withTimeout = (p, ms = 60000) => Promise.race([
    p, new Promise((_, rej) => setTimeout(() => rej(new Error('Image generation timed out')), ms))
  ]);
  
  if (typeof websim === 'undefined' || !websim.imageGen) throw new Error('Image generator not available');

  const result = await withTimeout(websim.imageGen({ prompt: artPrompt, transparent: true })).catch((e) => {
    throw e;
  });
  return result.url;
}

async function saveToDB(name, prompt, definition) {
  try {
    const rec = await room.collection('custom_weapon').create({
      name, prompt, definition
    });
    return rec;
  } catch (e) {
    console.warn('Save failed:', e);
    return null;
  }
}

// Load gallery items from DB, newest first
async function loadGallery() {
  try {
    const items = await room.collection('custom_weapon').getList();
    return (items || []).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  } catch (e) {
    console.warn('Gallery load failed:', e);
    return [];
  }
}

// Emit a global event so other UIs (e.g., Customizer) can refresh options
function emitRegistryUpdated() {
  window.dispatchEvent(new CustomEvent('custom-weapons:updated'));
}

function renderGallery(items, currentUsername) {
  const wrap = document.getElementById('ai-gallery');
  if (!wrap) return;
  if (!items || items.length === 0) {
    wrap.innerHTML = '<div class="ai-gallery-empty">No custom weapons yet. Generate and save one!</div>';
    return;
  }
  wrap.innerHTML = items.map(it => {
    const def = it.definition || {};
    const img = def.imageUrl || '';
    const uname = (it.username || 'user');
    const avatar = `https://images.websim.com/avatar/${encodeURIComponent(uname)}`;
    const canDelete = currentUsername && uname && (uname === currentUsername);
    return `
      <div class="ai-gallery-item" data-id="${it.id}">
        <img src="${img || 'test_ball_icon.png'}" style="width:48px;height:48px;image-rendering:pixelated;border:2px solid #000;border-radius:8px;background:#fff;">
        <div class="meta">
          <div><strong>${it.name}</strong></div>
          <div class="author">@${uname}</div>
        </div>
        <div class="actions">
          <button data-action="apply-left" data-name="${it.name}">Left</button>
          <button data-action="apply-right" data-name="${it.name}">Right</button>
          <button data-action="apply-all" data-name="${it.name}">All</button>
          ${canDelete ? `<button data-action="delete" data-id="${it.id}">Delete</button>` : ``}
        </div>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await playClickSound();
      const action = btn.getAttribute('data-action');
      if (action === 'delete') {
        const id = btn.getAttribute('data-id');
        try {
          await room.collection('custom_weapon').delete(id);
        } catch (e) {
          console.warn('Delete failed:', e);
        }
        // Remove from runtime registry if present
        const card = btn.closest('.ai-gallery-item');
        const name = card?.querySelector('[data-action="apply-left"]')?.getAttribute('data-name');
        if (name && window.customWeaponRegistry) {
          delete window.customWeaponRegistry[name];
        }
        // Refresh gallery
        refreshGallery();
        return;
      }
      const name = btn.getAttribute('data-name');
      const mode = getCurrentGamemode();
      if (!window.customWeaponRegistry || !window.customWeaponRegistry[name]) return;
      const def = window.customWeaponRegistry[name];
      if (action === 'apply-left' && players[0]) players[0].setWeapon('custom:'+name, players[0].color);
      if (action === 'apply-right' && players[1]) players[1].setWeapon('custom:'+name, players[1].color);
      if (action === 'apply-all') {
        getTargets(mode).forEach(p => { if (p && p.isAlive) p.setWeapon('custom:'+name, p.color); });
      }
      // Notify UI to refresh any displays
      window.dispatchEvent(new CustomEvent('custom-weapons:applied'));
    });
  });
}

async function refreshGallery() {
  const items = await loadGallery();
  // Merge into registry
  if (!window.customWeaponRegistry) window.customWeaponRegistry = {};
  items.forEach(it => {
    if (it && it.name && it.definition) {
      window.customWeaponRegistry[it.name] = it.definition;
    }
  });
  window.dispatchEvent(new CustomEvent('custom-weapons:updated'));
  const currentUser = await window.websim.getCurrentUser().catch(() => null);
  const uname = currentUser?.username || null;
  renderGallery(items, uname);
}

export function setupAIMaker() {
  const openBtn = document.getElementById('aiMakerButton');
  const modal = document.getElementById('ai-maker-menu');
  const closeBtn = document.getElementById('ai-close-btn');
  const genBtn = document.getElementById('ai-generate-btn');
  const saveBtn = document.getElementById('ai-save-btn');
  const nameInput = document.getElementById('ai-weapon-name');
  const archSel = document.getElementById('ai-archetype');
  const promptArea = document.getElementById('ai-prompt');
  const preview = document.getElementById('ai-preview');
  const imgPrev = document.getElementById('ai-image-preview');

  if (!openBtn || !modal) return;

  openBtn.addEventListener('click', async () => {
    await playClickSound();
    modal.style.display = 'flex';
    preview.textContent = '{ waiting for generation }';
    imgPrev.src = '';
    saveBtn.disabled = true;
    refreshGallery();
  });
  closeBtn.addEventListener('click', async () => {
    await playClickSound();
    modal.style.display = 'none';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  let lastDef = null;

  genBtn.addEventListener('click', async () => {
    await playClickSound();
    const name = (nameInput.value || '').trim() || 'Custom';
    const archetype = archSel.value || 'melee';
    const desc = (promptArea.value || '').trim() || 'A balanced custom weapon.';
    preview.textContent = 'Generating definition...';
    saveBtn.disabled = true;
    try {
      const def = await generateDefinition(name, archetype, desc);
      preview.textContent = JSON.stringify(def, null, 2);
      lastDef = def;
      imgPrev.src = '';
      const url = await generateImage(name, archetype, desc);
      imgPrev.src = url;
      def.imageUrl = url;
      preview.textContent = JSON.stringify(def, null, 2);
      saveBtn.disabled = false;
    } catch (e) {
      preview.textContent = 'Generation failed or timed out. Please try again.';
      console.error(e);
    }
  });

  saveBtn.addEventListener('click', async () => {
    await playClickSound();
    if (!lastDef) return;
    const name = (nameInput.value || '').trim() || lastDef.name || 'Custom';
    const desc = (promptArea.value || '').trim();
    // Save to DB
    const rec = await saveToDB(name, desc, lastDef);
    // Update runtime registry
    if (!window.customWeaponRegistry) window.customWeaponRegistry = {};
    window.customWeaponRegistry[name] = lastDef;
    emitRegistryUpdated();
    await refreshGallery();
    saveBtn.disabled = true;
  });

  // Live updates
  try {
    room.collection('custom_weapon').subscribe(() => {
      (async () => {
        await refreshGallery();
      })().catch(() => {/* swallow subscription async errors */});
    });
  } catch {}
}