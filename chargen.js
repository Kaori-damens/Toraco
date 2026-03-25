// ============================================================
// CHARGEN FLOW
// ============================================================
const CHARGEN_STEPS = ['name','race','subrace','str','spd','dur','iq','biq','ma','hasweapon','weapon','skillcount','skillpick','done'];
let cgState = null;
let cgRoster = JSON.parse(localStorage.getItem('cgRoster') || '[]');
let quickCreateMode = false;
let quickCreateName = ''; // custom name from prompt

function initChargen() {
  cgState = {
    step: 'name', name: '', race: null, subrace: null,
    stats: { strength:null, speed:null, durability:null, iq:null, battleiq:null, ma:null },
    hasWeapon: null,  // true = armed, false = unarmed (fists)
    weapon: null,
    skillCount: 0,    // how many skills to roll
    skills: [],       // array of SKILL_DEF objects picked
  };
  showScreen('chargen');
  renderCgDots();
  renderCgStep();
}

function renderCgDots() {
  const row = document.getElementById('cgDots');
  const steps = ['name','race','subrace','str','spd','dur','iq','biq','ma','hasweapon','weapon','skillcount','skillpick','done'];
  const cur = steps.indexOf(cgState.step);
  row.innerHTML = steps.map((s,i) =>
    `<div class="cg-dot ${i < cur ? 'done' : i === cur ? 'active' : ''}"></div>`
  ).join('');
}

function renderCgStep() {
  renderCgDots();
  const box = document.getElementById('cg-content');
  box.innerHTML = '';
  const s = cgState.step;
  if (s === 'name')    { cgRenderName(box); return; }
  if (s === 'race') {
    cgRenderSpin(box, 'Choose Race', CG_RACES.map((r,i) => ({ label: r.emoji+' '+r.name, weight: r.weight, color: wColor(i) })), (w, idx) => { cgState.race = CG_RACES[idx]; advanceCg(); });
    // Debug: quick-pick buttons
    const dbg = document.createElement('div');
    dbg.style.cssText = 'margin-top:10px;padding:8px 12px;background:#1a1a2e;border:1px dashed #ff6b35;border-radius:8px;';
    dbg.innerHTML = `<div style="font-size:11px;color:#ff6b35;margin-bottom:6px;letter-spacing:1px;">DEBUG — Pick Race</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">${CG_RACES.map((r,i) =>
        `<button onclick="cgState.race=CG_RACES[${i}];advanceCg();" style="background:#2a2a4a;border:1px solid #444;border-radius:5px;color:#ccc;cursor:pointer;font-size:11px;padding:3px 8px;">${r.emoji} ${r.name}</button>`
      ).join('')}</div>`;
    box.appendChild(dbg);
    return;
  }
  if (s === 'subrace') {
    const sr = CG_SUBRACES[cgState.race.subKey];
    if (!sr) { advanceCg(); return; }
    cgRenderSpin(box, `${cgState.race.emoji} Sub-Race`, sr.map((r,i) => ({ label:r.label, weight:r.weight, color:wColor(i) })), (w,idx) => { cgState.subrace = { ...sr[idx] }; advanceCg(); });
    return;
  }
  const STAT_STEPS = { str:'strength', spd:'speed', dur:'durability', iq:'iq', biq:'battleiq', ma:'ma' };
  if (s === 'iq' && cgState.race?.id === 'skeleton') {
    cgState.stats.iq = 1;
    advanceCg();
    return;
  }
  if (STAT_STEPS[s]) {
    const sk = STAT_STEPS[s];
    const sd = STAT_DISPLAY.find(x => x.key === sk);
    const raceId = (cgState.race.id === 'skeleton' && cgState.subrace?.raceId)
      ? cgState.subrace.raceId
      : cgState.race.id;
    const weights = CG_STAT_WEIGHTS[sk][raceId] || Array(10).fill(10);
    const items = weights.map((w,i) => ({ label: String(i+1), weight: w, color: STAT_COLORS[i] }));
    cgRenderSpin(box, `${sd.emoji} ${sd.label}`, items, (w,idx) => { cgState.stats[sk] = idx+1; advanceCg(); },
      cgState.stats);
    return;
  }
  if (s === 'hasweapon') {
    const items = [
      { label: '⚔️ Armed',   weight: 80, color: '#44ccff' },
      { label: '✊ Unarmed', weight: 20, color: '#ff8844' },
    ];
    cgRenderSpin(box, '🎰 Has Weapon?', items, (_w, idx) => {
      cgState.hasWeapon = (idx === 0);
      if (!cgState.hasWeapon) cgState.weapon = 'fists'; // skip weapon wheel
      advanceCg();
    });
    return;
  }
  if (s === 'weapon') {
    cgRenderSpin(box, '🗡️ Weapon', CG_WEAPONS_ARMED.map((w,i) => ({ label:w.label, weight:1, color:wColor(i) })), (w,idx) => { cgState.weapon = CG_WEAPONS_ARMED[idx].id; advanceCg(); });
    return;
  }
  if (s === 'skillcount') {
    const raceId = cgState.race?.id || 'human';
    const weights = CG_SKILL_COUNT_WEIGHTS[raceId] || [20, 20, 20, 20, 20];
    const items = weights.map((w, i) => ({
      label: i === 0 ? '0 Skills' : `${i} Skill${i > 1 ? 's' : ''}`,
      weight: w,
      color: wColor(i + 4),
    }));
    cgRenderSpin(box, `${cgState.race.emoji} How many Skills?`, items, (_w, idx) => {
      cgState.skillCount = idx;
      advanceCg();
    });
    return;
  }
  if (s === 'skillpick') { cgRenderSkillPick(box); return; }
  if (s === 'done') { cgRenderDone(box); }
}

function advanceCg() {
  const order = ['name','race','subrace','str','spd','dur','iq','biq','ma','hasweapon','weapon','skillcount','skillpick','done'];
  let next = order.indexOf(cgState.step) + 1;
  // If unarmed, skip weapon wheel
  if (order[next] === 'weapon' && cgState.hasWeapon === false) next++;
  // If 0 skills rolled, skip the skill-pick wheel
  if (order[next] === 'skillpick' && cgState.skillCount === 0) next++;
  cgState.step = order[Math.min(next, order.length - 1)];
  renderCgStep();
}

function cgRenderName(box) {
  box.innerHTML = `
    <div class="cg-card">
      <div class="cg-label">Step 1 — Enter Character Name</div>
      <div class="cg-name-row">
        <input class="cg-name-input" id="cgNameInput" placeholder="Enter name..." maxlength="24" value="${cgState.name}" autofocus>
        <button class="cg-random-btn" id="cgRandomName" title="Random hero name">🎲</button>
      </div>
      <div class="cg-nav">
        <button class="cg-btn" id="cgBackMenu">← Back</button>
        <button class="cg-btn primary" id="cgNameNext">Next →</button>
      </div>
    </div>`;
  document.getElementById('cgRandomName').onclick = () => {
    const input = document.getElementById('cgNameInput');
    input.value = getRandomGameName();
    input.style.borderColor = '#3a3a6a';
    input.focus();
  };
  document.getElementById('cgNameNext').onclick = () => {
    const v = document.getElementById('cgNameInput').value.trim();
    if (!v) { document.getElementById('cgNameInput').style.borderColor = '#ff4455'; return; }
    cgState.name = v; advanceCg();
  };
  document.getElementById('cgNameInput').onkeydown = e => { if (e.key === 'Enter') document.getElementById('cgNameNext').click(); };
  document.getElementById('cgBackMenu').onclick = () => { showScreen('menu'); buildFightersPanel(); renderRoster(); };
  // Quick create: auto-fill name (custom or random) and advance
  if (quickCreateMode) {
    document.getElementById('cgNameInput').value = quickCreateName || getRandomGameName();
    setTimeout(() => document.getElementById('cgNameNext').click(), 400);
  }
}

function cgRenderSpin(box, title, items, onResult, currentStats) {
  const hasStats = currentStats && Object.values(currentStats).some(v => v !== null);
  const statsHtml = hasStats ? `<div class="cg-stats-grid">${STAT_DISPLAY.map(sd => {
    const v = currentStats[sd.key];
    const statStep = {strength:'str',speed:'spd',durability:'dur',iq:'iq',battleiq:'biq',ma:'ma'};
    const isActive = cgState.step === statStep[sd.key];
    return `<div class="cg-sc ${isActive?'cg-active':v?'cg-done':''}">
      <div class="cg-sc-lbl">${sd.emoji} ${sd.label}</div>
      <div class="cg-sc-val ${v?'':' cg-pending'}">${v ?? '—'}</div>
    </div>`;
  }).join('')}</div>` : '';

  box.innerHTML = `
    <div class="cg-card">
      <div class="cg-label">${title}</div>
      ${statsHtml}
      <div class="spin-wrap">
        <canvas id="spinCanvas" width="360" height="360"></canvas>
        <div class="spin-ptr"></div>
      </div>
      <div id="cgResultBox"></div>
      <div class="cg-nav">
        <button class="spin-btn" id="cgSpinBtn">🎰 SPIN!</button>
      </div>
      <div class="cg-nav" id="cgNextNav" style="display:none">
        <button class="cg-btn primary" id="cgSpinNext">Next →</button>
      </div>
      ${cgState.race ? `<div class="cg-trait">${cgState.race.emoji} <b>${cgState.race.name}</b>${cgState.race.trait ? ' — '+cgState.race.trait : ''}</div>` : ''}
    </div>`;

  const wheel = new SpinWheel(document.getElementById('spinCanvas'), items);
  let lastWinIdx = -1;
  const doSpin = () => {
    document.getElementById('cgSpinBtn').disabled = true;
    document.getElementById('cgNextNav').style.display = 'none';
    wheel.spin((winner, idx) => {
      lastWinIdx = idx;
      document.getElementById('cgResultBox').innerHTML = `<div class="cg-result-box">${winner.label}</div>`;
      document.getElementById('cgNextNav').style.display = 'flex';
      playTone(660, 'sine', 0.4, 0.15, 0.5);
      // Quick create: auto-advance after spin lands
      if (quickCreateMode) setTimeout(() => document.getElementById('cgSpinNext')?.click(), 600);
    });
  };
  document.getElementById('cgSpinBtn').onclick = doSpin;
  document.getElementById('cgSpinNext') && (document.getElementById('cgSpinNext').onclick = () => {
    if (lastWinIdx < 0) return;
    onResult(items[lastWinIdx], lastWinIdx);
  });
  // Quick create: auto-trigger spin after short delay
  if (quickCreateMode) setTimeout(doSpin, 300);
}

function cgRenderSkillPick(box) {
  const total    = cgState.skillCount;
  const picked   = cgState.skills;
  const pickedIds = new Set(picked.map(s => s.id));
  const available = SKILL_DEFS.filter(s => !pickedIds.has(s.id));
  const spinNum  = picked.length + 1;

  const pickedHtml = picked.length > 0
    ? `<div class="cg-skills-picked">${picked.map(s =>
        `<span class="cg-skill-tag" title="${s.desc}">${s.icon} ${s.name}</span>`
      ).join('')}</div>`
    : '';

  const items = available.map((s, i) => ({
    label: s.icon + ' ' + s.name,
    weight: 1,
    color: wColor(i),
  }));

  box.innerHTML = `
    <div class="cg-card">
      <div class="cg-label">🌀 Skill ${spinNum} of ${total}</div>
      ${pickedHtml}
      <div class="spin-wrap">
        <canvas id="spinCanvas" width="360" height="360"></canvas>
        <div class="spin-ptr"></div>
      </div>
      <div id="cgResultBox"></div>
      <div class="cg-nav">
        <button class="spin-btn" id="cgSpinBtn">🎰 SPIN!</button>
      </div>
      <div class="cg-nav" id="cgNextNav" style="display:none">
        <button class="cg-btn primary" id="cgSpinNext">
          ${spinNum < total ? 'Next Skill →' : 'Done ✓'}
        </button>
      </div>
      ${cgState.race ? `<div class="cg-trait">${cgState.race.emoji} <b>${cgState.race.name}</b></div>` : ''}
    </div>`;

  const wheel = new SpinWheel(document.getElementById('spinCanvas'), items);
  let pickedSkill = null;

  const doSpin = () => {
    document.getElementById('cgSpinBtn').disabled = true;
    document.getElementById('cgNextNav').style.display = 'none';
    wheel.spin((winner, idx) => {
      pickedSkill = available[idx];
      document.getElementById('cgResultBox').innerHTML =
        `<div class="cg-result-box">${winner.label}<br><span style="color:#888;font-size:12px">${pickedSkill.desc}</span></div>`;
      document.getElementById('cgNextNav').style.display = 'flex';
      playTone(660, 'sine', 0.4, 0.15, 0.5);
      if (quickCreateMode) setTimeout(() => document.getElementById('cgSpinNext')?.click(), 600);
    });
  };

  document.getElementById('cgSpinBtn').onclick = doSpin;
  document.getElementById('cgSpinNext').onclick = () => {
    if (!pickedSkill) return;
    cgState.skills.push(pickedSkill);
    if (cgState.skills.length >= total) {
      advanceCg();
    } else {
      renderCgStep(); // re-render skillpick with updated picked list
    }
  };

  if (quickCreateMode) setTimeout(doSpin, 300);
}

function cgRenderDone(box) {
  const r = cgState.race, sr = cgState.subrace, st = cgState.stats;
  const wep = CG_WEAPONS.find(w => w.id === cgState.weapon);
  box.innerHTML = `
    <div class="cg-card">
      <div class="cg-label" style="font-size:20px;color:#fff;font-weight:900">${r.emoji} ${cgState.name}</div>
      <div style="color:#7a9ac0;font-size:14px">${r.name}${sr ? ' · '+sr.label : ''}</div>
      <div class="cg-summary">
        <div class="cg-sum-row"><span class="cg-sum-lbl">Weapon</span><span class="cg-sum-val">${wep?.label ?? '—'}</span></div>
        ${sr ? `<div class="cg-sum-row"><span class="cg-sum-lbl">Sub-Race</span><span class="cg-sum-val">${sr.label}</span></div>` : ''}
        ${STAT_DISPLAY.map(sd => `<div class="cg-sum-row"><span class="cg-sum-lbl">${sd.emoji} ${sd.label}</span><span class="cg-sum-val" style="color:${STAT_COLORS[(st[sd.key]||1)-1]}">${st[sd.key] ?? '—'}</span></div>`).join('')}
      ${cgState.skills?.length > 0 ? cgState.skills.map(s => `<div class="cg-sum-row"><span class="cg-sum-lbl">Skill</span><span class="cg-sum-val">${s.icon} ${s.name}</span></div>`).join('') : '<div class="cg-sum-row"><span class="cg-sum-lbl">Skills</span><span class="cg-sum-val" style="color:#555">None</span></div>'}
      </div>
      ${r.trait ? `<div class="cg-trait">${r.trait}</div>` : ''}
      ${sr?.desc ? `<div class="cg-trait">Sub-Race bonus: ${sr.desc}</div>` : ''}
      <div class="cg-nav">
        <button class="cg-btn" id="cgRestart">↺ Restart</button>
        <button class="cg-btn primary" id="cgSave">📜 Add to Radosers</button>
      </div>
    </div>`;
  document.getElementById('cgRestart').onclick = () => initChargen();
  const saveChar = () => {
    const char = {
      id: Date.now() + Math.random(),
      name: cgState.name, race: cgState.race.id, raceName: cgState.race.name,
      raceEmoji: cgState.race.emoji, subrace: cgState.subrace,
      stats: { ...cgState.stats }, weapon: cgState.weapon,
      color: BALL_COLORS[cgRoster.length % BALL_COLORS.length],
      skills: (cgState.skills || []).map(s => s.id),
    };
    cgRoster.push(char);
    localStorage.setItem('cgRoster', JSON.stringify(cgRoster));
    quickCreateMode = false;
    showScreen('menu'); buildFightersPanel(); renderRoster(); renderHeroShowcase();
  };
  document.getElementById('cgSave').onclick = saveChar;
  // Quick create: auto-save
  if (quickCreateMode) setTimeout(saveChar, 800);
}

