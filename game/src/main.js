// CINDER BAY — Ashfall Isle. Main loop: input, driving + walking, wanted police,
// staged missions, crew + standing, garage/shop, save, title screen, HUD, minimap.
// 12 missions, 7 districts, 3 crew. Original city, names and story.
import { makeRng, clamp, dist, angleTo, angleLerp, formatCash } from './rng.js';
import { buildCity, districtAt, hitsBuilding, WORLD } from './city.js';
import { CREW, freshStanding, standingEffect, bumpStanding, crewBonus } from './crew.js';
import { MISSIONS, MISSION_PAYOUTS, currentMission, currentStage, missionState } from './missions.js';
import { spawnTraffic, updateTraffic, spawnPolice, updatePolice, makeHeli, updateHeli, spawnRoadblock, carCollides } from './vehicles.js';
import { spawnPeds, updatePeds } from './peds.js';
import { makeAudio, ensureAudio, radioTick, blip, RADIO } from './audio.js';
import { loadSave, writeSave, clearSave } from './save.js';
import { drawWorld, drawCar, drawPed, skyColors } from './render.js';
import { drawHUD } from './hud.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const SHOT = parseInt(params.get('shot') || '0', 10);

const rng = makeRng(20261123);
const city = buildCity(20261123);

const state = {
  city, screen: 'title', paused: false, shotMode: false, frozen: false,
  time: 0, timeOfDay: 18.2, dayLength: 240,
  player: { x: 480, y: 480, angle: 0, speed: 0, inCar: false, carColor: '#ff7a2f', onFootSpeed: 0 },
  inCar: false, carName: 'EMBER GT', carsOwned: ['EMBER GT'],
  traffic: spawnTraffic(city, 20261123, 26),
  peds: spawnPeds(20261123, 42),
  police: [], heli: null, heliName: 'CAPTAIN VOSS — AIR ONE', roadblock: null,
  bullets: [], toasts: [],
  mission: missionState(0), missionStage: null, missionBrief: '', missionGiver: '',
  wanted: 0, heat: 0, hideTimer: 0,
  cash: 500, score: 0, best: 0, health: 100, armor: 0, speedKmh: 0,
  standing: freshStanding(), crew: CREW.map(c => ({ ...c })),
  radioStation: 0, audio: makeAudio(),
  busted: false, won: false, menu: null, restartAt: 0, savedMission: 0,
  camX: 0, camY: 0,
};

function refreshMission() {
  const m = currentMission(state);
  state.missionStage = currentStage(state);
  state.missionBrief = m.brief;
  state.missionGiver = m.giver;
}
refreshMission();

function toast(text) {
  state.toasts.push({ text, ttl: 6 });
  if (state.toasts.length > 3) state.toasts.shift();
}

// ---- Save ----
const saved = loadSave();
if (saved) {
  state.best = saved.best || 0;
  state.savedMission = saved.missionIndex || 0;
}

// ---- Input ----
const keys = {};
let mouse = { x: 640, y: 360, down: false };
addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  ensureAudio(state.audio);
  if (state.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) { startGame(saved && saved.missionIndex ? saved.missionIndex : 0); }
  if (e.key === 'p' || e.key === 'P') state.paused = !state.paused;
  if (e.key === 'm' || e.key === 'M') state.audio.muted = !state.audio.muted;
  if (e.key === 'r' || e.key === 'R') {
    if (state.busted || state.won) { restartRun(); }
    else { state.radioStation = (state.radioStation + 1) % RADIO.length; toast('RADIO: ' + RADIO[state.radioStation].name); }
  }
  if ((e.key === 'e' || e.key === 'E') && state.screen === 'playing') toggleCar();
  if ((e.key === 'g' || e.key === 'G') && state.screen === 'playing') toggleMenu();
  if (e.key === 'f' || e.key === 'F') shoot();
  if (state.menu && ['1', '2', '3', '4'].includes(e.key)) buyItem(parseInt(e.key, 10));
  if (e.key === 'Escape') state.menu = null;
});
addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (1280 / r.width);
  mouse.y = (e.clientY - r.top) * (720 / r.height);
});
canvas.addEventListener('mousedown', (e) => { mouse.down = true; ensureAudio(state.audio); shoot(); });
addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('click', () => {
  if (state.screen === 'title') startGame(saved && saved.missionIndex ? saved.missionIndex : 0);
});

function startGame(missionIndex) {
  state.screen = 'playing';
  state.mission = missionState(missionIndex || 0);
  refreshMission();
  toast('MISSION ' + (state.mission.index + 1) + '/12 — ' + currentMission(state).name);
  blip(state.audio, 660, 0.2, 'square');
}

function restartRun() {
  clearSave();
  Object.assign(state, {
    cash: 500, score: 0, health: 100, armor: 0, wanted: 0, heat: 0,
    standing: freshStanding(), busted: false, won: false, menu: null,
    police: [], heli: null, roadblock: null,
  });
  state.player.x = 480; state.player.y = 480; state.player.inCar = false; state.player.speed = 0;
  state.mission = missionState(0);
  refreshMission();
  toast('New run — Cinder Bay is yours to take.');
}

function toggleCar() {
  const P = state.player;
  if (state.menu) return;
  if (!P.inCar) {
    // Steal the nearest traffic car.
    let best = null, bestD = 90;
    for (const c of state.traffic) {
      const d = dist(P.x, P.y, c.x, c.y);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (best) {
      P.inCar = true; state.inCar = true;
      P.carColor = best.color; state.carName = best.name;
      state.traffic.splice(state.traffic.indexOf(best), 1);
      toast('STOLE ' + best.name + ' — nice wheels.');
      raiseWanted(1, 'car theft');
    } else toast('No car nearby — walk to a road.');
  } else {
    P.inCar = false; state.inCar = false;
    P.x += Math.cos(P.angle + Math.PI / 2) * 30;
    P.y += Math.sin(P.angle + Math.PI / 2) * 30;
    toast('On foot. Find a car and press E.');
  }
}

function toggleMenu() {
  if (state.menu) { state.menu = null; return; }
  const near = (list) => list.some(s => dist(state.player.x, state.player.y, s.x, s.y) < 120);
  if (near(city.garages)) state.menu = 'garage';
  else if (near(city.shops)) state.menu = 'shop';
  else toast('No garage or shop here — follow the ■ markers on the minimap.');
}

function buyItem(n) {
  const d = districtAt(state.player.x, state.player.y);
  const eff = standingEffect(state.standing[d.id]);
  const price = (base) => Math.round(base * eff.price);
  if (state.menu === 'garage') {
    if (n === 1 && state.cash >= price(200)) { state.cash -= price(200); state.health = 100; toast('REPAIRED to full health — ' + formatCash(price(200))); }
    else if (n === 2 && state.cash >= price(300)) { state.cash -= price(300); state.armor = 100; toast('ARMOR fitted — ' + formatCash(price(300))); }
    else if (n === 3 && state.cash >= price(1500)) { state.cash -= price(1500); state.carsOwned.push('EMBER GT+'); state.carName = 'EMBER GT+'; toast('ENGINE UPGRADE — top speed up!'); }
    else if (n === 4 && state.cash >= price(500) && state.wanted > 0) { state.cash -= price(500); state.wanted = 0; state.heat = 0; state.police = []; state.heli = null; toast('BRIBE paid — the heat is off.'); }
    else toast('Not enough cash, or nothing to buy.');
  } else {
    if (n === 1 && state.cash >= price(150)) { state.cash -= price(150); state.health = clamp(state.health + 50, 0, 100); toast('MEDKIT — health +50.'); }
    else if (n === 2 && state.cash >= price(300)) { state.cash -= price(300); state.armor = 100; toast('KEVLAR vest fitted.'); }
    else if (n === 3 && state.cash >= price(800)) { state.cash -= price(800); state.score += 500; toast('EMBER-GLASS charm — score +500.'); }
    else if (n === 4) { state.menu = null; toast('Back to the streets.'); }
    else toast('Not enough cash.');
  }
  blip(state.audio, 520, 0.12, 'square');
}

function shoot() {
  if (state.screen !== 'playing' || state.paused || state.menu) return;
  const P = state.player;
  const wx = state.camX + mouse.x, wy = state.camY + mouse.y;
  const a = angleTo(P.x, P.y, wx, wy);
  state.bullets.push({ x: P.x, y: P.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, ttl: 0.9 });
  blip(state.audio, 180, 0.08, 'square');
  raiseWanted(0.4, 'shots fired');
}

function raiseWanted(amount, why) {
  if (state.won || state.busted) return;
  const d = districtAt(state.player.x, state.player.y);
  const eff = standingEffect(state.standing[d.id]);
  state.wanted = clamp(state.wanted + amount * eff.police, 0, 5);
  state.heat = clamp(state.heat + amount * 12, 0, 100);
  if (state.wanted >= 1 && state.police.length === 0) {
    state.police = spawnPolice(city, state.player.x, state.player.y, 2 + Math.floor(state.wanted), 555);
    toast('POLICE on you — ' + why.toUpperCase());
  }
  if (state.wanted >= 3 && !state.heli) {
    state.heli = makeHeli(state.player.x, state.player.y);
    toast('✈ AIR ONE overhead — CAPTAIN VOSS is hunting you.');
  }
  if (state.wanted >= 4 && !state.roadblock) {
    state.roadblock = spawnRoadblock(city, state.player.x, state.player.y, state.player.angle);
    toast('ROADBLOCK ahead — punch through or go around.');
  }
}

// ---- Update ----
function update(dt) {
  state.time += dt;
  state.timeOfDay = (state.timeOfDay + dt / state.dayLength) % 24;
  const P = state.player;

  // Steering / throttle.
  const up = keys['w'] || keys['arrowup'];
  const down = keys['s'] || keys['arrowdown'];
  const left = keys['a'] || keys['arrowleft'];
  const right = keys['d'] || keys['arrowright'];
  const brake = keys[' '];

  if (P.inCar) {
    const top = 320 * crewBonus(state, 'speed');
    if (up) P.speed += 260 * dt;
    if (down) P.speed -= 200 * dt;
    if (brake) P.speed *= Math.max(0, 1 - dt * 4);
    P.speed = clamp(P.speed, -120, top);
    P.speed *= Math.max(0, 1 - dt * 0.35);
    const steer = (left ? -1 : 0) + (right ? 1 : 0);
    P.angle += steer * dt * 2.2 * clamp(Math.abs(P.speed) / 120, 0, 1) * (P.speed < 0 ? -1 : 1);
    const nx = P.x + Math.cos(P.angle) * P.speed * dt;
    const ny = P.y + Math.sin(P.angle) * P.speed * dt;
    if (!hitsBuilding(city, nx, ny, 14)) { P.x = nx; P.y = ny; }
    else { P.speed *= -0.25; state.health -= 2; }
    P.x = clamp(P.x, 30, WORLD - 30); P.y = clamp(P.y, 30, WORLD - 30);
    state.speedKmh = Math.abs(P.speed) * 0.9;
  } else {
    const sp = 170;
    let mx = (right ? 1 : 0) - (left ? 1 : 0);
    let my = (down ? 1 : 0) - (up ? 1 : 0);
    const len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= len; my /= len;
      P.angle = Math.atan2(my, mx);
      const nx = P.x + mx * sp * dt, ny = P.y + my * sp * dt;
      if (!hitsBuilding(city, nx, ny, 8)) { P.x = nx; P.y = ny; }
      state.speedKmh = 6;
    } else state.speedKmh = 0;
  }

  // Camera follows the player.
  state.camX = clamp(P.x - 640, 0, WORLD - 1280);
  state.camY = clamp(P.y - 360, 0, WORLD - 720);

  updateTraffic(city, state.traffic, dt, state.time);
  updatePeds(state.peds, P.x, P.y, Math.abs(P.speed || 0), dt, state.time);
  radioTick(state.audio, dt);

  // Traffic collisions: bumping a car at speed raises heat.
  if (P.inCar) {
    for (const c of state.traffic) {
      if (carCollides(P, c, 34) && Math.abs(P.speed) > 140) {
        raiseWanted(0.5, 'hit and run');
        P.speed *= 0.5;
        state.health -= 3;
        state.score = Math.max(0, state.score - 50);
      }
    }
    for (const cop of state.police) {
      if (carCollides(P, cop, 34)) {
        cop.speed *= 0.4; P.speed *= 0.6;
        state.health -= 4; raiseWanted(0.3, 'rammed a unit');
      }
    }
    if (state.roadblock) {
      for (const v of state.roadblock.vans) {
        if (carCollides(P, v, 32) && Math.abs(P.speed) > 60) {
          P.speed *= -0.4; state.health -= 8;
          state.roadblock = null;
          toast('SMASHED through the roadblock!');
          state.score += 300;
        }
      }
      state.roadblock.ttl -= dt;
      if (state.roadblock.ttl <= 0) state.roadblock = null;
    }
    // Lava hurts.
    for (const l of city.lava) {
      if (dist(P.x, P.y, l.x, l.y) < l.r * 0.7) { state.health -= 30 * dt; toast('LAVA! Get off the flow!'); }
    }
  }

  // Bullets.
  for (const b of state.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.ttl -= dt;
    for (const cop of state.police) {
      if (dist(b.x, b.y, cop.x, cop.y) < 26) {
        cop.speed = 0; b.ttl = 0;
        state.score += 150; toast('Unit disabled — +150.');
      }
    }
  }
  state.bullets = state.bullets.filter(b => b.ttl > 0);

  // Police chase + heli.
  if (state.police.length) {
    updatePolice(state.police, P.x, P.y, dt, state.wanted);
    if (state.wanted <= 0) state.police = [];
  }
  if (state.heli) updateHeli(state.heli, P.x, P.y, dt, state.time);
  if (state.wanted >= 3 && !state.heli) state.heli = makeHeli(P.x, P.y);
  if (state.wanted < 3) state.heli = null;

  // Wanted decay: hide (slow, no police near) or let the hacker crew work.
  const nearestCop = state.police.reduce((m, c) => Math.min(m, dist(P.x, P.y, c.x, c.y)), Infinity);
  if (state.wanted > 0 && nearestCop > 500 && Math.abs(P.speed || 0) < 40) {
    state.hideTimer += dt;
    if (state.hideTimer > 20) { state.wanted = Math.max(0, state.wanted - 1); state.hideTimer = 0; toast('Heat dropping — they lost you.'); }
  } else state.hideTimer = 0;
  if (state.wanted > 0) {
    state.wanted = clamp(state.wanted - dt * 0.01 * crewBonus(state, 'wantedDecay'), 0, 5);
    if (state.wanted < 0.5) { state.wanted = 0; state.police = []; state.heli = null; state.roadblock = null; }
  }
  state.heat = clamp(state.heat - dt * 1.2, 0, 100);

  // Mission progress.
  if (!state.won && state.missionStage) {
    const st = state.missionStage;
    const d = dist(P.x, P.y, st.x, st.y);
    if (d < 70) {
      const m = currentMission(state);
      state.score += 400;
      blip(state.audio, 880, 0.18, 'sine');
      if (state.mission.stage < 2) {
        state.mission.stage++;
        toast('STAGE ' + (state.mission.stage) + '/3 done — ' + currentStage(state).label);
        refreshMission();
      } else {
        const payout = Math.round(MISSION_PAYOUTS[state.mission.index] * standingEffect(state.standing[st.district]).payout);
        state.cash += payout;
        state.score += 1000;
        bumpStanding(state.standing, st.district, 8);
        toast('MISSION COMPLETE: ' + m.name + ' — +' + formatCash(payout));
        blip(state.audio, 990, 0.3, 'sine');
        writeSave(state);
        if (state.mission.index >= 11) {
          state.won = true;
          state.best = Math.max(state.best, state.score);
          writeSave(state);
        } else {
          state.mission = missionState(state.mission.index + 1);
          refreshMission();
          toast('NEXT: MISSION ' + (state.mission.index + 1) + '/12 — ' + currentMission(state).name);
        }
      }
    }
  }

  // Score trickles while driving fast and clean.
  if (P.inCar && Math.abs(P.speed) > 200 && state.wanted === 0) state.score += dt * 12;

  // Busted.
  if (state.health <= 0 && !state.busted) {
    state.health = 0; state.busted = true;
    state.best = Math.max(state.best, state.score);
    writeSave(state);
  }

  // Toasts age.
  for (const t of state.toasts) t.ttl -= dt;
  state.toasts = state.toasts.filter(t => t.ttl > 0);

  // Keep traffic topped up.
  if (state.traffic.length < 20) {
    const more = spawnTraffic(city, 20261123 + Math.floor(state.time), 6);
    state.traffic.push(...more);
  }
}

// ---- Render ----
function render() {
  const P = state.player;
  const view = { x: state.camX || 0, y: state.camY || 0, w: 1280, h: 720 };
  ctx.save();
  ctx.translate(-view.x, -view.y);
  drawWorld(ctx, city, state, { x: view.x, y: view.y }, view, state.time);
  // Mission waypoint line from player.
  if (state.missionStage && state.screen === 'playing') {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(state.missionStage.x, state.missionStage.y); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Traffic, police, roadblock, peds, bullets.
  for (const c of state.traffic) drawCar(ctx, c.x, c.y, c.angle, c.color, null, 0);
  for (const cop of state.police) drawCar(ctx, cop.x, cop.y, cop.angle, cop.color, cop.id, cop.siren);
  if (state.roadblock) for (const v of state.roadblock.vans) drawCar(ctx, v.x, v.y, v.angle, v.color, 'ROADBLOCK', 0);
  for (const p of state.peds) drawPed(ctx, p, state.time);
  ctx.fillStyle = '#ffe66d';
  for (const b of state.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }
  // Heli shadow + body.
  if (state.heli) {
    const h = state.heli;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(h.x + 24, h.y + 30, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#20242c';
    ctx.beginPath(); ctx.arc(h.x, h.y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AIR ONE — CAPT. VOSS', h.x, h.y - 26);
    ctx.textAlign = 'left';
    // Spotlight cone.
    ctx.fillStyle = 'rgba(255, 240, 180, 0.14)';
    ctx.beginPath();
    ctx.moveTo(h.x, h.y);
    ctx.lineTo(P.x - 90, P.y - 40); ctx.lineTo(P.x + 90, P.y - 40);
    ctx.closePath(); ctx.fill();
  }
  // Player.
  if (P.inCar) drawCar(ctx, P.x, P.y, P.angle, P.carColor, state.carName, 0);
  else {
    ctx.fillStyle = '#ff7a2f';
    ctx.beginPath(); ctx.arc(P.x, P.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1410';
    ctx.beginPath(); ctx.arc(P.x, P.y - 3, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', P.x, P.y - 18);
    ctx.textAlign = 'left';
  }
  ctx.restore();

  // Night / dusk tint over everything.
  const pal = skyColors(state.timeOfDay);
  if (pal.glow > 0.4) {
    ctx.fillStyle = 'rgba(20, 8, 4, ' + (pal.glow * 0.22).toFixed(3) + ')';
    ctx.fillRect(0, 0, 1280, 720);
  }

  if (state.screen === 'playing') {
    drawHUD(ctx, state, city, state.time);
    if (state.menu) drawMenu();
  } else {
    drawTitle();
  }
}

function drawMenu() {
  const d = districtAt(state.player.x, state.player.y);
  const eff = standingEffect(state.standing[d.id]);
  ctx.fillStyle = 'rgba(10,6,4,0.92)';
  ctx.fillRect(390, 150, 500, 380);
  ctx.strokeStyle = '#ff7a2f'; ctx.lineWidth = 2;
  ctx.strokeRect(390, 150, 500, 380);
  ctx.fillStyle = '#ff7a2f';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(state.menu === 'garage' ? "JUNO'S GARAGE" : 'EMBER MART — SHOP', 410, 190);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  ctx.fillText(d.name + ' standing ' + state.standing[d.id] + ' (' + eff.label + ') — prices x' + eff.price, 410, 214);
  ctx.font = 'bold 15px sans-serif';
  if (state.menu === 'garage') {
    ctx.fillText('[1] Repair to full — $200', 410, 260);
    ctx.fillText('[2] Armor 100 — $300', 410, 290);
    ctx.fillText('[3] Engine upgrade — $1,500', 410, 320);
    ctx.fillText('[4] Bribe the heat away — $500', 410, 350);
  } else {
    ctx.fillText('[1] Medkit +50 health — $150', 410, 260);
    ctx.fillText('[2] Kevlar vest — $300', 410, 290);
    ctx.fillText('[3] Ember-glass charm +500 score — $800', 410, 320);
    ctx.fillText('[4] Leave', 410, 350);
  }
  ctx.fillStyle = '#ffd166';
  ctx.font = '14px sans-serif';
  ctx.fillText('Cash: ' + formatCash(state.cash) + '   ·   Esc to close', 410, 400);
  ctx.fillStyle = '#ffb37a';
  ctx.font = '12px sans-serif';
  ctx.fillText('Standing 70+ in a district cuts prices 15% and pays 25% more per mission.', 410, 440);
  ctx.fillText('Standing under 25 makes police jumpier and shops dearer.', 410, 462);
}

function drawTitle() {
  ctx.fillStyle = 'rgba(12, 5, 3, 0.78)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ff7a2f';
  ctx.font = 'bold 74px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CINDER BAY', 640, 190);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('ASHFALL ISLE  ·  12 MISSIONS · 7 DISTRICTS · 3 CREW', 640, 232);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('A volcanic island city. One crew, seven districts, and Captain Voss on your tail.', 640, 268);
  ctx.fillText('Finish all 12 staged missions, win the island\'s standing, and reach $50,000.', 640, 294);
  ctx.fillStyle = '#ffb37a';
  ctx.font = '14px sans-serif';
  ctx.fillText('CREW: JUNO REYES (driver) · KAI TANAKA (hacker) · LENA ORTIZ (lookout)', 640, 330);
  ctx.fillText('WASD drive & walk · E steal / exit car · F / CLICK shoot · SPACE handbrake', 640, 356);
  ctx.fillText('R radio · G garage / shop · M mute · P pause · save is automatic', 640, 380);
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(state.savedMission ? '▶  PRESS ENTER — CONTINUE MISSION ' + (state.savedMission + 1) + '/12' : '▶  PRESS ENTER OR CLICK TO START', 640, 440);
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px sans-serif';
  ctx.fillText('WIN: finish 12 missions + $50,000   ·   LOSE: busted or wrecked', 640, 478);
  ctx.fillText('Best score: ' + Math.floor(state.best).toLocaleString('en-US'), 640, 502);
  ctx.textAlign = 'left';
}

// ---- Loop ----
let last = performance.now();
let shotTicks = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.screen === 'playing' && !state.paused && !state.busted && !state.won && !state.menu) {
    if (state.shotMode) {
      // Autopilot the chase for a few seconds, then freeze on the money frame.
      keys['w'] = true;
      if (shotTicks < 170) { update(dt); shotTicks++; }
      else state.frozen = true;
    } else update(dt);
  }
  render();
  requestAnimationFrame(frame);
}

// Shot mode: stage the scene before the first frame.
if (SHOT >= 1 && SHOT <= 4) {
  state.camX = 0; state.camY = 0;
  applyShot(state, SHOT);
  refreshMission();
}
requestAnimationFrame(frame);
