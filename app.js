// ============================================================
// EcoTrack — Application Core (Logic, Physics & UI)
// ============================================================

(function(){
'use strict';

// ─── STATE & STORAGE ───────────────────────────────────────
const SK = 'ecotrack_v2';
let S = load();

const REGION_AVGS = {
  world: { label: 'World Avg', val: 12.88 },
  usa: { label: 'USA Avg', val: 42.52 },
  eu: { label: 'EU Avg', val: 18.63 },
  uk: { label: 'UK Avg', val: 15.07 },
  india: { label: 'India Avg', val: 5.21 }
};

function load() {
  try {
    const d = localStorage.getItem(SK);
    if(d) return {...defaults(),...JSON.parse(d)};
  } catch(e){}
  return defaults();
}

function defaults() {
  return {
    logs: [],
    streak: 0,
    lastLog: null,
    xp: 0,
    badges: [],
    challenges: {},
    goal: null,
    theme: 'dark',
    region: 'world',
    budget: null
  };
}

function save() {
  try {
    localStorage.setItem(SK, JSON.stringify(S));
  } catch(e){}
}

// ─── CONFETTI PHYSICS SYSTEM ──────────────────────────────
let confettiActive = false;
let confettiParticles = [];
const confettiColors = ['#10b981', '#06d6a0', '#34d399', '#818cf8', '#f59e0b', '#f472b6', '#2dd4bf'];

function triggerConfetti() {
  const c = document.getElementById('c-confetti');
  if (!c) return;
  const ctx = c.getContext('2d');
  c.width = window.innerWidth;
  c.height = window.innerHeight;

  confettiParticles = [];
  for (let i = 0; i < 130; i++) {
    confettiParticles.push({
      x: c.width / 2,
      y: c.height + 20,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 16 - 12,
      size: Math.random() * 8 + 5,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      r: Math.random() * 360,
      vr: (Math.random() - 0.5) * 8,
      gravity: 0.38,
      wind: (Math.random() - 0.5) * 0.08
    });
  }

  if (!confettiActive) {
    confettiActive = true;
    requestAnimationFrame(updateConfetti);
  }
}

function updateConfetti() {
  const c = document.getElementById('c-confetti');
  if (!c) { confettiActive = false; return; }
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);

  let alive = false;
  confettiParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx += p.wind;
    p.r += p.vr;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r * Math.PI / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();

    if (p.y < c.height && p.x > -20 && p.x < c.width + 20) {
      alive = true;
    }
  });

  if (alive) {
    requestAnimationFrame(updateConfetti);
  } else {
    ctx.clearRect(0, 0, c.width, c.height);
    confettiActive = false;
  }
}

// ─── UTILS (Timezone Aligned) ──────────────────────────────
const toLocalYYYYMMDD = (d) => {
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 10);
};

const today = () => toLocalYYYYMMDD(new Date());

const weekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return toLocalYYYYMMDD(new Date(d.setDate(diff)));
};

const todayLogs = () => S.logs.filter(l => l.date === today());
const weekLogs = () => { const ws = weekStart(); return S.logs.filter(l => l.date >= ws); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const calcCO2 = (cat, act, amt) => { const a = EF[cat]?.acts[act]; return a ? +(a.f * amt).toFixed(3) : 0; };
const fmtDate = s => { const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }); };

const catTotals = logs => {
  const t = {};
  Object.keys(EF).forEach(c => t[c] = 0);
  logs.forEach(l => { if(t[l.cat] !== undefined) t[l.cat] += l.co2; });
  Object.keys(t).forEach(k => t[k] = +t[k].toFixed(2));
  return t;
};

function getLevel(xp) {
  let cur = LEVELS[0];
  for(const lv of LEVELS) {
    if(xp >= lv.xp) cur = lv;
    else break;
  }
  const nx = LEVELS[cur.lv] || null;
  return { ...cur, next: nx, prog: nx ? (xp - cur.xp) / (nx.xp - cur.xp) : 1, toNext: nx ? nx.xp - xp : 0 };
}

function addXP(amount) {
  const lvBefore = getLevel(S.xp).lv;
  S.xp += amount;
  const lvAfter = getLevel(S.xp).lv;
  save();
  updateHdr();
  if (lvAfter > lvBefore) {
    const nextLv = LEVELS.find(l => l.lv === lvAfter);
    if (nextLv) {
      setTimeout(() => {
        showModal({
          i: nextLv.i,
          l: `Reached Level ${nextLv.lv}!`,
          d: `Congratulations, you are now a ${nextLv.t}!`
        });
        triggerConfetti();
      }, 500);
    }
  }
}

function getDailyCh(n = 3) {
  const ds = today();
  let h = 0;
  for(let i = 0; i < ds.length; i++) h = ((h << 5) - h) + ds.charCodeAt(i) | 0;
  const sh = [...CHALLENGES].sort((a, b) => {
    const numA = parseInt(a.id.slice(1)) || 0;
    const numB = parseInt(b.id.slice(1)) || 0;
    return (((h * 31 + numA) % 1000) - ((h * 31 + numB) % 1000));
  });
  return sh.slice(0, n);
}

function getGreeting() {
  const h = new Date().getHours();
  if(h < 6) return 'Good night';
  if(h < 12) return 'Good morning';
  if(h < 17) return 'Good afternoon';
  return 'Good evening';
}

function last7() {
  const d = [];
  for(let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const ds = toLocalYYYYMMDD(dt);
    d.push({
      date: ds,
      label: dt.toLocaleDateString('en', { weekday: 'short' }),
      total: +S.logs.filter(l => l.date === ds).reduce((s, l) => s + l.co2, 0).toFixed(2)
    });
  }
  return d;
}

function getRelevantTips(n = 4) {
  if(!S.logs.length) return [...TIPS].sort(() => Math.random() - 0.5).slice(0, n);
  const ct = catTotals(S.logs), sorted = Object.entries(ct).sort(([,a], [,b]) => b - a).map(([c]) => c);
  const res = [];
  for(const c of sorted) {
    const t = TIPS.filter(x => x.cat === c).sort(() => Math.random() - 0.5);
    res.push(...t.slice(0, 2));
    if(res.length >= n) break;
  }
  if(res.length < n) res.push(...TIPS.filter(x => x.cat === 'general').sort(() => Math.random() - 0.5).slice(0, n - res.length));
  return res.slice(0, n);
}

// ─── ROUTER ────────────────────────────────────────────────
const VIEWS = ['dash', 'log', 'insights', 'goals', 'history', 'settings'];

function nav(v) {
  if(!VIEWS.includes(v)) v = 'dash';
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('v-' + v);
  if(el) el.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-v="${v}"]`)?.classList.add('active');
  location.hash = v;
  render(v);
  document.getElementById('main-scroll').scrollTop = 0;
}

function render(v) {
  ({
    dash: rDash,
    log: rLog,
    insights: rInsights,
    goals: rGoals,
    history: rHistory,
    settings: rSettings
  })[v]?.();
}

// ─── ANIMATE COUNTER ───────────────────────────────────────
function animNum(id, target, dec = 2) {
  const el = document.getElementById(id);
  if(!el) return;
  const start = parseFloat(el.textContent) || 0, dur = 700, t0 = performance.now();
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = (start + (target - start) * e).toFixed(dec);
    if(p < 1) requestAnimationFrame(tick);
  })(t0);
}

// ─── CHARTS (Canvas Dimension Safe + CSS variables safe) ──
function setupCanvas(id) {
  const c = document.getElementById(id);
  if(!c) return null;
  const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1, r = c.getBoundingClientRect();
  if(r.width <= 0 || r.height <= 0) return null;
  c.width = r.width * dpr;
  c.height = r.height * dpr;
  ctx.scale(dpr, dpr);
  return { ctx, w: r.width, h: r.height };
}

function drawDonut(data, colors) {
  const s = setupCanvas('c-donut');
  if(!s) return;
  const { ctx, w, h } = s, cx = w / 2, cy = h / 2, R = Math.min(cx, cy) - 15, lw = 24;
  const total = data.reduce((s, d) => s + d.v, 0);
  ctx.clearRect(0, 0, w, h);
  if(total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-track').trim() || '#1e293b';
    ctx.lineWidth = lw;
    ctx.stroke();
    return;
  }
  let a = -Math.PI / 2;
  data.forEach((d, i) => {
    if(d.v <= 0) return;
    const sa = a, ea = a + (d.v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, sa, ea);
    ctx.strokeStyle = colors[i] || '#666';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();
    a = ea + 0.03;
  });
}

function drawTrend(data) {
  const s = setupCanvas('c-trend');
  if(!s) return;
  const { ctx, w, h } = s, p = { t: 16, r: 16, b: 30, l: 40 }, cw = w - p.l - p.r, ch = h - p.t - p.b;
  const mx = Math.max(...data.map(d => d.total), 3);
  const tc = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#eee';
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = tc;
  ctx.lineWidth = 1;
  for(let i = 0; i <= 3; i++) {
    const y = p.t + ch / 3 * i;
    ctx.beginPath();
    ctx.moveTo(p.l, y);
    ctx.lineTo(w - p.r, y);
    ctx.globalAlpha = 0.07;
    ctx.stroke();

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = tc;
    ctx.font = '10px Inter,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((mx - mx / 3 * i).toFixed(1), p.l - 6, y + 3);
  }
  ctx.globalAlpha = 1.0;

  if(!data.length) return;
  const bw = Math.min(cw / data.length * 0.55, 36), gap = cw / data.length;
  data.forEach((d, i) => {
    const x = p.l + gap * i + gap / 2 - bw / 2, bh = (d.total / mx) * ch, y = p.t + ch - bh;
    const gr = ctx.createLinearGradient(x, y, x, p.t + ch);
    gr.addColorStop(0, '#10b981');
    gr.addColorStop(1, 'rgba(16, 185, 129, 0.15)');
    ctx.fillStyle = gr;
    const r = Math.min(bw / 2, 5);
    ctx.beginPath();
    ctx.moveTo(x, p.t + ch);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + bw - r, y);
    ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
    ctx.lineTo(x + bw, p.t + ch);
    ctx.closePath();
    ctx.fill();

    if(d.total > 0) {
      ctx.fillStyle = '#10b981';
      ctx.font = '600 10px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.total.toFixed(1), x + bw / 2, y - 5);
    }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = tc;
    ctx.font = '10px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, p.l + gap * i + gap / 2, h - 6);
    ctx.globalAlpha = 1.0;
  });
}

function drawMonthly(logs) {
  const s = setupCanvas('c-monthly');
  if(!s) return;
  const { ctx, w, h } = s, p = { t: 16, r: 16, b: 30, l: 40 }, cw = w - p.l - p.r, ch = h - p.t - p.b;
  ctx.clearRect(0, 0, w, h);
  const dd = [];
  for(let i = 29; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const ds = toLocalYYYYMMDD(dt);
    dd.push({
      date: ds,
      label: dt.getDate() + '',
      total: +logs.filter(l => l.date === ds).reduce((s, l) => s + l.co2, 0).toFixed(2)
    });
  }
  const mx = Math.max(...dd.map(d => d.total), 3), gap = cw / (dd.length - 1 || 1);
  const tc = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#eee';

  ctx.strokeStyle = tc;
  ctx.lineWidth = 1;
  for(let i = 0; i <= 3; i++) {
    const y = p.t + ch / 3 * i;
    ctx.beginPath();
    ctx.moveTo(p.l, y);
    ctx.lineTo(w - p.r, y);
    ctx.globalAlpha = 0.07;
    ctx.stroke();

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = tc;
    ctx.font = '9px Inter,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((mx - mx / 3 * i).toFixed(1), p.l - 5, y + 3);
  }
  ctx.globalAlpha = 1.0;

  // Area
  ctx.beginPath();
  ctx.moveTo(p.l, p.t + ch);
  dd.forEach((d, i) => { const x = p.l + gap * i, y = p.t + ch - (d.total / mx) * ch; ctx.lineTo(x, y); });
  ctx.lineTo(p.l + gap * (dd.length - 1), p.t + ch);
  ctx.closePath();
  const gr = ctx.createLinearGradient(0, p.t, 0, p.t + ch);
  gr.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
  gr.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
  ctx.fillStyle = gr;
  ctx.fill();

  ctx.beginPath();
  dd.forEach((d, i) => { const x = p.l + gap * i, y = p.t + ch - (d.total / mx) * ch; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.stroke();

  dd.forEach((d, i) => {
    if(d.total > 0) {
      const x = p.l + gap * i, y = p.t + ch - (d.total / mx) * ch;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
    }
  });

  dd.forEach((d, i) => {
    if(i % 5 === 0 || i === dd.length - 1) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = tc;
      ctx.font = '9px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, p.l + gap * i, h - 6);
      ctx.globalAlpha = 1.0;
    }
  });
}

// ─── DASHBOARD ─────────────────────────────────────────────
function rDash() {
  const tl = todayLogs(), tt = tl.reduce((s, l) => s + l.co2, 0);
  document.getElementById('greet').textContent = getGreeting();
  document.getElementById('hero-date').textContent = fmtDate(today());
  document.getElementById('streak-n').textContent = S.streak;
  animNum('today-co2', tt);

  // Benchmarks regionalization
  const regionConfig = REGION_AVGS[S.region || 'world'] || REGION_AVGS.world;
  const regionAvg = regionConfig.val;
  document.getElementById('comp-lbl-avg').textContent = `${regionConfig.label}: ${regionAvg.toFixed(2)} kg`;

  setTimeout(() => {
    document.getElementById('comp-fill').style.width = Math.min(tt / regionAvg * 100, 100) + '%';
    document.getElementById('comp-marker').style.left = Math.min(tt / regionAvg * 100, 100) + '%';
  }, 100);

  // Carbon budget check banner
  const warn = document.getElementById('budget-warning');
  if(S.budget && tt > S.budget) {
    warn.classList.remove('hidden');
  } else {
    warn.classList.add('hidden');
  }

  // Donut
  const ct = catTotals(tl), keys = Object.keys(ct);
  drawDonut(keys.map(k => ({ v: ct[k] })), keys.map(k => CAT_COLORS[k]));
  document.getElementById('donut-val').textContent = tt.toFixed(2);
  document.getElementById('legend').innerHTML = keys.map(k => `
    <div class="legend-row">
      <span class="legend-dot" style="background:${CAT_COLORS[k]}"></span>
      <span>${EF[k].icon} ${EF[k].label}</span>
      <span class="legend-val">${ct[k].toFixed(2)}</span>
    </div>`).join('');
  drawTrend(last7());
  // Quick log
  const qlg = document.getElementById('ql-grid');
  qlg.innerHTML = PRESETS.map(p => {
    const co2 = calcCO2(p.cat, p.act, p.amt);
    return `<button class="ql-btn" data-p="${p.id}"><span class="ql-icon">${p.i}</span><span class="ql-label">${p.l}</span><span class="ql-co2">${co2.toFixed(2)} kg</span></button>`;
  }).join('');
  qlg.querySelectorAll('.ql-btn').forEach(b => b.onclick = () => {
    const pr = PRESETS.find(p => p.id === b.dataset.p);
    if(pr) {
      logAct(pr.cat, pr.act, pr.amt);
      b.style.transform = 'scale(0.93)';
      setTimeout(() => b.style.transform = '', 200);
    }
  });
  // Challenges
  const dc = document.getElementById('dash-ch'), chs = getDailyCh(3), comp = S.challenges[today()] || [];
  dc.innerHTML = chs.map(c => `
    <div class="ch-card ${comp.includes(c.id) ? 'done' : ''}" data-c="${c.id}">
      <div class="ch-check">${comp.includes(c.id) ? '✓' : ''}</div>
      <span class="ch-text">${c.t}</span>
      <span class="ch-xp">+${c.xp} XP</span>
    </div>`).join('');
  dc.querySelectorAll('.ch-card').forEach(c => c.onclick = () => toggleCh(c.dataset.c));
  updateHdr();
}

// ─── LOG VIEW ──────────────────────────────────────────────
let selCat = 'transport', selAct = null;

function rLog() { rCatTabs(); rActGrid(); rEntries(); hideLF(); }

function rCatTabs() {
  const el = document.getElementById('cat-tabs');
  el.innerHTML = Object.keys(EF).map(k => `
    <button class="cat-tab ${k === selCat ? 'active' : ''}" data-c="${k}" ${k === selCat ? `style="background:${CAT_COLORS[k]};border-color:${CAT_COLORS[k]};box-shadow: 0 0 15px ${CAT_COLORS[k]}33"` : ''} >
      ${EF[k].icon} ${EF[k].label}
    </button>`).join('');
  el.querySelectorAll('.cat-tab').forEach(b => b.onclick = () => { selCat = b.dataset.c; selAct = null; rCatTabs(); rActGrid(); hideLF(); });
}

function rActGrid() {
  const el = document.getElementById('act-grid'), acts = EF[selCat].acts;
  el.innerHTML = Object.keys(acts).map(k => {
    const a = acts[k];
    return `
      <div class="act-card glass-spotlight ${selAct === k ? 'sel' : ''}" data-a="${k}" ${selAct === k ? `style="border-color:${CAT_COLORS[selCat]};box-shadow:0 0 15px ${CAT_COLORS[selCat]}33"` : ''} >
        <span class="ai">${a.i}</span>
        <span class="al">${a.l}</span>
        <span class="af">${a.f} kg/${a.u}</span>
      </div>`;
  }).join('');
  el.querySelectorAll('.act-card').forEach(c => c.onclick = () => { selAct = c.dataset.a; rActGrid(); showLF(); });
}

function showLF() {
  if(!selAct) return;
  const f = document.getElementById('log-form'), a = EF[selCat].acts[selAct];
  document.getElementById('lf-icon').textContent = a.i;
  document.getElementById('lf-title').textContent = a.l;
  document.getElementById('lf-unit').textContent = 'Unit: ' + a.u;
  document.getElementById('lf-amount').value = 1;

  // Add description contexts
  const descriptions = {
    car_petrol: "Typical medium-sized gasoline car. Average emissions per kilometer driven.",
    car_diesel: "Diesel engine car. Slightly lower CO2 than petrol, but higher particulate matter.",
    car_ev: "Electric vehicle charging emissions based on standard grid averages. Very clean!",
    bus: "Local diesel/hybrid transit bus per passenger kilometer. Sharing space cuts emissions.",
    train: "Passenger rail commute. One of the cleanest transit systems available.",
    subway: "Electric subway or metro rail commute per kilometer. High efficiency.",
    flight_dom: "Domestic short-haul flight. Heavy takeoff emissions represent high CO2 per km.",
    flight_long: "Long-haul flight. Slightly more efficient per km than short flights, but massive totals.",
    electricity: "Household electrical consumption per kilowatt-hour, based on grid average power plants.",
    solar: "Solar panel offset credits. Reduces your carbon footprint by generating green energy!",
    beef: "Beef production represents high emissions due to methane and intensive land/feed usage.",
    plant_meal: "Salads, grains, or beans. Plant foods produce minimal emissions.",
    landfill: "Landfill waste produces methane. Disposal here should be minimized.",
    recycling: "Recycled material avoids raw material extractions, representing a low carbon impact.",
    composting: "Organic matter decomposition in a compost pile produces tiny offsets compared to landfills."
  };
  document.getElementById('lf-desc').textContent = descriptions[selAct] || `Track and log emissions for ${a.l}. Estimations are based on average lifecycle analysis.`;

  // Sync range slider
  const slider = document.getElementById('lf-slider');
  slider.value = 1;
  // Dynamic ranges based on unit type
  if(a.u === 'km') { slider.min = 1; slider.max = 100; slider.step = 1; }
  else if(a.u === 'kWh') { slider.min = 1; slider.max = 50; slider.step = 0.5; }
  else if(a.u === 'hours') { slider.min = 0.5; slider.max = 24; slider.step = 0.5; }
  else { slider.min = 1; slider.max = 10; slider.step = 1; }
  document.getElementById('lf-slider-val').textContent = slider.value + ' ' + a.u;

  updPreview();
  f.classList.remove('hidden');
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideLF() { document.getElementById('log-form').classList.add('hidden'); selAct = null; }

function updPreview() {
  const amt = parseFloat(document.getElementById('lf-amount')?.value) || 0;
  document.getElementById('lf-preview').textContent = calcCO2(selCat, selAct, amt).toFixed(2) + ' kg';
}

function rEntries() {
  const el = document.getElementById('entries'), tl = todayLogs();
  document.getElementById('entry-ct').textContent = tl.length + ' entries';
  if(!tl.length) {
    el.innerHTML = '<div class="empty"><span class="empty-icon">📝</span><p>No entries yet. Start logging!</p></div>';
    return;
  }
  el.innerHTML = tl.map(e => {
    const a = EF[e.cat]?.acts[e.act];
    return `
      <div class="entry glass-spotlight">
        <span class="entry-icon">${a?.i || '📋'}</span>
        <div class="entry-info">
          <div class="entry-name">${a?.l || e.act}</div>
          <div class="entry-detail">${e.amt} ${a?.u || 'units'}</div>
        </div>
        <span class="entry-co2" style="color:${CAT_COLORS[e.cat]}">${e.co2.toFixed(2)} kg</span>
        <span class="entry-time">${e.time}</span>
        <button class="entry-del" data-id="${e.id}">🗑️</button>
      </div>`;
  }).join('');
  el.querySelectorAll('.entry-del').forEach(b => b.onclick = e => { e.stopPropagation(); delEntry(b.dataset.id); });
}

// ─── INSIGHTS ──────────────────────────────────────────────
function rInsights() {
  const wl = weekLogs(), wt = wl.reduce((s, l) => s + l.co2, 0);
  animNum('week-total', wt);

  // Update offset simulator starting position
  const offsetSlider = document.getElementById('offset-slider');
  if(offsetSlider) {
    offsetSlider.value = Math.min(Math.round(wt), 150);
    updateOffsetSim(offsetSlider.value);
  }

  const regionConfig = REGION_AVGS[S.region || 'world'] || REGION_AVGS.world;
  const avgW = regionConfig.val * 7, vt = document.getElementById('vs-text'), vd = document.getElementById('vs-dot');
  if(!wl.length) {
    vt.textContent = 'Log activities to see comparison';
    vd.className = 'dot neutral';
  } else if(wt < avgW) {
    vt.textContent = ((1 - wt / avgW) * 100).toFixed(0) + `% below regional average (${regionConfig.label})`;
    vd.className = 'dot good';
  } else {
    vt.textContent = ((wt / avgW - 1) * 100).toFixed(0) + `% above regional average (${regionConfig.label})`;
    vd.className = 'dot bad';
  }
  const ct = catTotals(wl), sc = Object.entries(ct).sort(([,a], [,b]) => b - a), top = sc[0];
  if(top) {
    const c = EF[top[0]];
    document.getElementById('imp-icon').textContent = c?.icon || '📊';
    document.getElementById('imp-name').textContent = c?.label || top[0];
    document.getElementById('imp-val').textContent = top[1].toFixed(1) + ' kg';
    document.getElementById('imp-detail').textContent = wl.length && top[1] > 0 ? ((top[1] / wt) * 100).toFixed(0) + '% of weekly emissions' : 'Log more to see insights';
  }
  rTips();
  // Weekday/weekend
  let wdT = 0, wdD = new Set(), weT = 0, weD = new Set();
  S.logs.forEach(l => {
    const d = new Date(l.date + 'T00:00:00').getDay();
    if(d === 0 || d === 6) { weT += l.co2; weD.add(l.date); }
    else { wdT += l.co2; wdD.add(l.date); }
  });
  const wdA = wdD.size ? wdT / wdD.size : 0, weA = weD.size ? weT / weD.size : 0, mx = Math.max(wdA, weA, 1);
  setTimeout(() => {
    document.getElementById('wd-bar').style.height = (wdA / mx * 100) + '%';
    document.getElementById('we-bar').style.height = (weA / mx * 100) + '%';
  }, 200);
  document.getElementById('wd-val').textContent = wdA.toFixed(1) + ' kg/day';
  document.getElementById('we-val').textContent = weA.toFixed(1) + ' kg/day';
  // What-if
  const wif = document.getElementById('whatif-list'), scenarios = [];
  const carL = wl.filter(l => l.act === 'car_petrol' || l.act === 'car_diesel'), carCO2 = carL.reduce((s, l) => s + l.co2, 0);
  if(carCO2 > 0) {
    const km = carL.reduce((s, l) => s + l.amt, 0), saved = (carCO2 - km * 0.089).toFixed(1);
    if(saved > 0) scenarios.push({ q: `If you took the bus instead of driving (${km.toFixed(0)} km)...`, a: `Save ${saved} kg CO₂/week — ${(saved * 52).toFixed(0)} kg/year! 🚌` });
  }
  const beefL = wl.filter(l => l.act === 'beef'), beefCO2 = beefL.reduce((s, l) => s + l.co2, 0);
  if(beefCO2 > 0) {
    const srv = beefL.reduce((s, l) => s + l.amt, 0), saved = (beefCO2 - srv * 1.82).toFixed(1);
    if(saved > 0) scenarios.push({ q: `If you swapped beef for chicken (${srv} servings)...`, a: `Save ${saved} kg CO₂ — ${(saved * 52).toFixed(0)} kg/year! 🍗` });
  }
  if(scenarios.length < 2) {
    scenarios.push(
      { q: 'If you used LED bulbs instead of incandescent...', a: 'Save ~200 kg CO₂/year — like planting 9 trees! 🌳' },
      { q: 'If you had one meatless day per week...', a: 'Save ~200 kg CO₂/year — equivalent to 800 km less driving! 🥗' }
    );
  }
  wif.innerHTML = scenarios.slice(0, 3).map(s => `<div class="whatif-card glass"><p class="whatif-q">${s.q}</p><p class="whatif-a">${s.a}</p></div>`).join('');
}

function rTips() {
  const el = document.getElementById('tips-list'), tips = getRelevantTips(4);
  const impL = { high: 'High Impact', medium: 'Medium', low: 'Low' };
  el.innerHTML = tips.map(t => `
    <div class="tip glass-spotlight">
      <span class="tip-icon">💡</span>
      <div>
        <span class="tip-badge ${t.imp}">${impL[t.imp]}</span>
        <p class="tip-text">${t.t}</p>
        ${t.s > 0 ? `<p class="tip-save">Potential: ~${t.s} kg CO₂/year</p>` : ''}
      </div>
    </div>`).join('');
}

function updateOffsetSim(kg) {
  // 1 tree absorbs ~22kg of CO2 per year
  const trees = Math.ceil(kg / 22);
  // Estimate tree cost at $1.50 per seedling
  const cost = trees * 1.50;
  document.getElementById('offset-slider-val').textContent = kg + ' kg';
  document.getElementById('sim-trees').textContent = trees;
  document.getElementById('sim-cost').textContent = '$' + cost.toFixed(2);
}

// ─── GOALS ─────────────────────────────────────────────────
function rGoals() {
  const lv = getLevel(S.xp);
  document.getElementById('lvl-icon').textContent = lv.i;
  document.getElementById('lvl-title').textContent = lv.t;
  document.getElementById('lvl-num').textContent = lv.lv;
  document.getElementById('xp-cur').textContent = S.xp + ' XP';
  document.getElementById('xp-next').textContent = lv.next ? lv.toNext + ' XP to next' : 'Max level! 🎉';
  setTimeout(() => document.getElementById('xp-fill').style.width = (lv.prog * 100) + '%', 100);
  // Goal
  const su = document.getElementById('goal-setup'), pr = document.getElementById('goal-prog');
  if(S.goal) {
    su.classList.add('hidden');
    pr.classList.remove('hidden');
    const wl = weekLogs(), wt = wl.reduce((s, l) => s + l.co2, 0), tg = S.goal.target, pct = Math.min(wt / tg * 100, 100), rem = Math.max(tg - wt, 0);
    document.getElementById('ring-pct').textContent = pct.toFixed(0) + '%';
    document.getElementById('g-cur').textContent = wt.toFixed(1);
    document.getElementById('g-tgt').textContent = tg;
    document.getElementById('g-rem').textContent = rem > 0 ? rem.toFixed(1) + ' kg remaining' : 'Goal reached! 🎉';
    const circ = 2 * Math.PI * 52, rf = document.getElementById('ring-fill');
    rf.style.strokeDasharray = circ;
    setTimeout(() => rf.style.strokeDashoffset = circ * (1 - pct / 100), 100);
    
    if (pct >= 100) award('goal_done');
  } else {
    su.classList.remove('hidden');
    pr.classList.add('hidden');
  }
  // Challenges
  const cl = document.getElementById('ch-list'), chs = getDailyCh(5), comp = S.challenges[today()] || [];
  cl.innerHTML = chs.map(c => `
    <div class="ch-card glass-spotlight ${comp.includes(c.id) ? 'done' : ''}" data-c="${c.id}">
      <div class="ch-check">${comp.includes(c.id) ? '✓' : ''}</div>
      <div style="flex:1">
        <span class="ch-text">${c.t}</span>
        <div style="display:flex;gap:5px;margin-top:5px">
          <span class="ch-diff ${c.diff}">${c.diff}</span>
        </div>
      </div>
      <span class="ch-xp">+${c.xp} XP</span>
    </div>`).join('');
  cl.querySelectorAll('.ch-card').forEach(c => c.onclick = () => toggleCh(c.dataset.c));
  // Badges
  document.getElementById('badge-ct').textContent = S.badges.length + ' / ' + BADGES.length;
  document.getElementById('badges').innerHTML = BADGES.map(b => `<div class="badge-item glass-spotlight ${S.badges.includes(b.id) ? 'unlocked' : 'locked'}" title="${b.d}"><span class="badge-bi">${b.i}</span><span class="badge-bl">${b.l}</span></div>`).join('');
}

// ─── HISTORY ───────────────────────────────────────────────
function rHistory() {
  const fs = document.getElementById('f-start'), fe = document.getElementById('f-end');
  if(!fs.value) {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    fs.value = toLocalYYYYMMDD(d);
  }
  if(!fe.value) fe.value = today();
  updHistory();
}

function updHistory() {
  const sd = document.getElementById('f-start')?.value || '', ed = document.getElementById('f-end')?.value || '', cat = document.getElementById('f-cat')?.value || 'all';
  let fl = S.logs.filter(l => {
    if(sd && l.date < sd) return false;
    if(ed && l.date > ed) return false;
    if(cat !== 'all' && l.cat !== cat) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date) || ((b.time || '').localeCompare(a.time || '')));
  const tt = fl.reduce((s, l) => s + l.co2, 0), ud = new Set(fl.map(l => l.date)).size;
  document.getElementById('h-total').textContent = tt.toFixed(2);
  document.getElementById('h-entries').textContent = fl.length;
  document.getElementById('h-avg').textContent = (ud ? tt / ud : 0).toFixed(2);
  drawMonthly(fl);
  const el = document.getElementById('hist-list');
  if(!fl.length) {
    el.innerHTML = '<div class="empty"><span class="empty-icon">📋</span><p>No activities found.</p></div>';
    return;
  }
  const gr = {};
  fl.forEach(e => { if(!gr[e.date]) gr[e.date] = []; gr[e.date].push(e); });
  el.innerHTML = Object.keys(gr).map(d => {
    const dt = gr[d].reduce((s, l) => s + l.co2, 0);
    return `
      <div class="hist-day">
        <div class="hist-date">${fmtDate(d)} — ${dt.toFixed(2)} kg CO₂</div>
        ${gr[d].map(e => {
          const a = EF[e.cat]?.acts[e.act];
          return `
            <div class="entry glass-spotlight">
              <span class="entry-icon">${a?.i || '📋'}</span>
              <div class="entry-info">
                <div class="entry-name">${a?.l || e.act}</div>
                <div class="entry-detail">${e.amt} ${a?.u || ''} • ${e.cat}</div>
              </div>
              <span class="entry-co2" style="color:${CAT_COLORS[e.cat]}">${e.co2.toFixed(2)} kg</span>
              <button class="entry-del" data-id="${e.id}">🗑️</button>
            </div>`;
        }).join('')}
      </div>`;
  }).join('');
  el.querySelectorAll('.entry-del').forEach(b => b.onclick = e => { e.stopPropagation(); delEntry(b.dataset.id); });
}

// ─── SETTINGS VIEW ─────────────────────────────────────────
function rSettings() {
  document.getElementById('set-region').value = S.region || 'world';
  document.getElementById('set-budget').value = S.budget || '';
}

// ─── CORE ACTIONS ──────────────────────────────────────────
function logAct(cat, act, amt) {
  const co2 = calcCO2(cat, act, amt), now = new Date();
  S.logs.push({ id: uid(), date: today(), time: now.toTimeString().slice(0, 5), cat, act, amt: +amt, co2 });
  updateStreak();
  addXP(5);
  checkBadges();
  save();
  const a = EF[cat]?.acts[act];
  toast(`${a?.i || '✅'} Logged ${a?.l || act}: ${co2.toFixed(2)} kg CO₂`);
  render(location.hash.slice(1) || 'dash');
}

function delEntry(id) {
  S.logs = S.logs.filter(l => l.id !== id);
  save();
  toast('🗑️ Entry removed', 'info');
  render(location.hash.slice(1) || 'dash');
}

function updateStreak() {
  const t = today(), y = new Date();
  y.setDate(y.getDate() - 1);
  const ys = toLocalYYYYMMDD(y);
  if(S.lastLog === t) return;
  S.streak = S.lastLog === ys ? S.streak + 1 : 1;
  S.lastLog = t;
  save();
}

function toggleCh(id) {
  const t = today();
  if(!S.challenges[t]) S.challenges[t] = [];
  const c = S.challenges[t], idx = c.indexOf(id);
  if(idx === -1) {
    c.push(id);
    const ch = CHALLENGES.find(x => x.id === id);
    if(ch) {
      addXP(ch.xp);
      toast(`⚡ Challenge done! +${ch.xp} XP`);
      triggerConfetti();
    }
  } else {
    c.splice(idx, 1);
    const ch = CHALLENGES.find(x => x.id === id);
    if(ch) S.xp = Math.max(0, S.xp - ch.xp);
  }
  checkBadges();
  save();
  render(location.hash.slice(1) || 'dash');
}

// ─── BADGE SYSTEM ──────────────────────────────────────────
function award(id) {
  if(S.badges.includes(id)) return;
  S.badges.push(id);
  save();
  const b = BADGES.find(x => x.id === id);
  if(b) {
    showModal(b);
    triggerConfetti();
  }
  addXP(20);
  save();
}

function checkBadges() {
  const n = S.logs.length, tl = todayLogs(), tt = tl.reduce((s, l) => s + l.co2, 0);
  if(n >= 1) award('first_log');
  if(n >= 10) award('ten_logs');
  if(n >= 50) award('fifty_logs');
  if(n >= 100) award('hundred_logs');
  if(S.streak >= 7) award('week_streak');
  if(S.streak >= 30) award('month_streak');
  if(tl.length > 0 && tt <= 2) award('low_day');
  if(tl.length > 0 && tt <= 1) award('ultra_low');
  const pm = S.logs.filter(l => l.act === 'plant_meal').length;
  if(pm >= 5) award('green_meal');
  const rc = S.logs.filter(l => l.act === 'recycling').length;
  if(rc >= 10) award('recycler');
  const cats = new Set(tl.map(l => l.cat));
  if(cats.size >= 5) award('all_cats');
  const tc = Object.values(S.challenges).reduce((s, a) => s + a.length, 0);
  if(tc >= 1) award('ch_first');
  if(tc >= 10) award('ch_ten');
}

// ─── UI HELPERS ────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast'), ic = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  document.getElementById('toast-i').textContent = ic[type] || '✅';
  document.getElementById('toast-m').textContent = msg;
  t.classList.remove('hidden');
  t.style.animation = 'none';
  t.offsetHeight;
  t.style.animation = 'toastIn 0.35s ease';
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.add('hidden'), 3000);
}

function showModal(b) {
  document.getElementById('m-icon').textContent = b.i || b.icon;
  document.getElementById('m-name').textContent = b.l || b.label;
  document.getElementById('m-desc').textContent = b.d || b.description;
  document.getElementById('modal').classList.remove('hidden');
}

function updateHdr() {
  const lv = getLevel(S.xp);
  document.getElementById('h-lvl-icon').textContent = lv.i;
  document.getElementById('h-lvl-text').textContent = 'Lvl ' + lv.lv;
  document.getElementById('h-xp-fill').style.width = (lv.prog * 100) + '%';
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  S.theme = t;
  document.getElementById('theme-ico').textContent = t === 'dark' ? '🌙' : '☀️';
  save();
  setTimeout(() => render(location.hash.slice(1) || 'dash'), 80);
}

// ─── DATA BACKUP & WIPES ───────────────────────────────────
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecotrack_backup_${today()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('📤 Data backup downloaded!');
}

function importData(e) {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if(data.logs && Array.isArray(data.logs)) {
        S = { ...defaults(), ...data };
        save();
        toast('📥 Data restored successfully!');
        render(location.hash.slice(1) || 'dash');
      } else {
        toast('❌ Invalid backup file format', 'error');
      }
    } catch(err) {
      toast('❌ Failed to parse backup file', 'error');
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if(confirm('Are you absolutely sure you want to delete ALL data? This will clear logs, streaks, and achievements permanently.')) {
    S = defaults();
    save();
    toast('♻️ All app data has been reset', 'info');
    render('dash');
  }
}

// ─── EVENT BINDING ─────────────────────────────────────────
function bind() {
  document.querySelectorAll('.nav-btn').forEach(b => b.onclick = () => nav(b.dataset.v));
  document.getElementById('btn-theme').onclick = () => setTheme(S.theme === 'dark' ? 'light' : 'dark');
  document.getElementById('btn-goto-log').onclick = () => nav('log');
  document.getElementById('btn-close-lf').onclick = hideLF;

  // Sync Input Box & Range Slider
  const amtInput = document.getElementById('lf-amount');
  const amtSlider = document.getElementById('lf-slider');
  
  amtInput.oninput = () => {
    amtSlider.value = amtInput.value;
    updPreview();
  };
  amtSlider.oninput = () => {
    amtInput.value = amtSlider.value;
    document.getElementById('lf-slider-val').textContent = amtSlider.value + ' ' + (EF[selCat]?.acts[selAct]?.u || '');
    updPreview();
  };

  // Adjusters
  document.getElementById('btn-dec').onclick = () => {
    amtInput.value = Math.max(0, (parseFloat(amtInput.value) || 0) - 0.5);
    amtSlider.value = amtInput.value;
    document.getElementById('lf-slider-val').textContent = amtSlider.value + ' ' + (EF[selCat]?.acts[selAct]?.u || '');
    updPreview();
  };
  document.getElementById('btn-inc').onclick = () => {
    amtInput.value = (parseFloat(amtInput.value) || 0) + 0.5;
    amtSlider.value = amtInput.value;
    document.getElementById('lf-slider-val').textContent = amtSlider.value + ' ' + (EF[selCat]?.acts[selAct]?.u || '');
    updPreview();
  };

  // Quick values shortcuts inside form
  document.querySelectorAll('.quick-val-btn').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.val;
      if(type === 'max') {
        amtInput.value = amtSlider.max;
      } else {
        amtInput.value = (parseFloat(amtInput.value) || 0) + parseFloat(type);
      }
      amtSlider.value = amtInput.value;
      document.getElementById('lf-slider-val').textContent = amtSlider.value + ' ' + (EF[selCat]?.acts[selAct]?.u || '');
      updPreview();
    };
  });

  document.getElementById('btn-submit-log').onclick = () => {
    if(!selCat || !selAct) return;
    const amt = parseFloat(amtInput.value) || 0;
    if(amt <= 0) { toast('Enter a valid amount', 'warning'); return; }
    logAct(selCat, selAct, amt);
    hideLF();
  };

  document.getElementById('btn-set-goal').onclick = () => {
    const v = parseFloat(document.getElementById('goal-inp')?.value);
    if(!v || v <= 0) { toast('Enter a valid goal', 'warning'); return; }
    S.goal = { target: v, start: weekStart() };
    award('goal_set');
    save();
    rGoals();
    toast('🎯 Goal set!');
  };
  document.getElementById('btn-reset-goal').onclick = () => { S.goal = null; save(); rGoals(); };
  document.getElementById('btn-close-modal').onclick = () => document.getElementById('modal').classList.add('hidden');
  document.getElementById('btn-re-tips').onclick = rTips;
  ['f-start', 'f-end', 'f-cat'].forEach(id => document.getElementById(id).onchange = updHistory);
  window.onhashchange = () => nav(location.hash.slice(1) || 'dash');
  
  // Settings view binds
  document.getElementById('set-region').onchange = (e) => { S.region = e.target.value; save(); toast('🌍 Regional benchmark updated!'); };
  document.getElementById('set-budget').oninput = (e) => { const v = parseFloat(e.target.value); S.budget = v > 0 ? v : null; save(); };
  document.getElementById('btn-export').onclick = exportData;
  document.getElementById('btn-import').onclick = () => document.getElementById('file-import').click();
  document.getElementById('file-import').onchange = importData;
  document.getElementById('btn-reset-data').onclick = resetData;

  // Offset Simulator Slider
  const offsetSlider = document.getElementById('offset-slider');
  if(offsetSlider) {
    offsetSlider.oninput = (e) => {
      updateOffsetSim(parseFloat(e.target.value) || 0);
    };
  }

  // Optimized Mouse Spotlight Glow coordinates tracker listener
  document.addEventListener('mousemove', e => {
    const card = e.target.closest('.glass-spotlight');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });

  let rt;
  window.onresize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => render(location.hash.slice(1) || 'dash'), 250);
  };
}

// ─── INIT ──────────────────────────────────────────────────
function init() {
  setTheme(S.theme || 'dark');
  bind();
  nav(location.hash.slice(1) || 'dash');

  setTimeout(() => {
    const ls = document.getElementById('loading'), ap = document.getElementById('app');
    ls.style.animation = 'fadeOut 0.5s ease forwards';
    setTimeout(() => {
      ls.style.display = 'none';
      ap.classList.remove('hidden');
      render(location.hash.slice(1) || 'dash');
    }, 500);
  }, 1800);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
