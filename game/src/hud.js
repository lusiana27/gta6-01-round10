// The dense HUD: mission + stage, wanted stars, score/best, cash, health, armor,
// speed, crew, district standing bars, radio, clock, minimap, boss line, win/lose.
import { formatCash, formatClock, clamp } from './rng.js';
import { DISTRICTS, WORLD } from './city.js';
import { missionLabel, currentStage, districtName } from './missions.js';
import { standingEffect, crewStatusLine } from './crew.js';
import { RADIO } from './audio.js';

function panel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = 'rgba(10, 6, 4, ' + (alpha || 0.72) + ')';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255, 122, 47, 0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

export function drawHUD(ctx, state, city, time) {
  const W = 1280, H = 720;
  const st = currentStage(state);
  const dist = districtAt(state.player.x, state.player.y);

  // ---- Top-left: title + mission block ----
  panel(ctx, 12, 12, 470, 118);
  ctx.fillStyle = '#ff7a2f';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('CINDER BAY', 24, 42);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ASHFALL ISLE  ·  12 MISSIONS · 7 DISTRICTS · 3 CREW', 24, 62);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(missionLabel(state), 24, 86);
  ctx.fillStyle = '#ffd166';
  ctx.font = '13px sans-serif';
  ctx.fillText('▶ ' + st.label, 24, 106);
  ctx.fillStyle = '#ffb37a';
  ctx.font = '12px sans-serif';
  ctx.fillText('“' + state.missionBrief + '” — ' + state.missionGiver, 24, 124);

  // ---- Top-center: wanted stars + boss ----
  panel(ctx, 500, 12, 280, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('WANTED', 512, 32);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < state.wanted ? '#ff3b30' : 'rgba(255,255,255,0.22)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('★', 580 + i * 26, 38);
  }
  ctx.fillStyle = state.wanted >= 3 ? '#ff6b5e' : '#ffb37a';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(state.wanted >= 3 ? '✈ ' + state.heliName : 'POLICE: ' + state.police.length + ' UNITS ON YOU', 512, 58);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.fillText('HEAT ' + Math.floor(state.heat) + '%  ·  ' + (state.wanted === 0 ? 'CLEAN — lay low' : 'HIDE 20s or BRIBE $500'), 512, 72);

  // ---- Top-right: cash / score / best / health ----
  panel(ctx, 798, 12, 470, 118);
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(formatCash(state.cash), 812, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('SCORE ' + Math.floor(state.score).toLocaleString('en-US') + '   BEST ' + Math.floor(state.best).toLocaleString('en-US'), 812, 66);
  bar(ctx, 812, 76, 200, 12, state.health / 100, '#37d67a', 'HEALTH ' + Math.floor(state.health));
  bar(ctx, 1024, 76, 200, 12, state.armor / 100, '#4fc3f7', 'ARMOR ' + Math.floor(state.armor));
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('SPEED ' + Math.floor(state.speedKmh) + ' km/h   ' + (state.inCar ? '🚗 ' + state.carName : '🚶 ON FOOT'), 812, 108);
  ctx.fillStyle = '#ffb37a';
  ctx.font = '12px sans-serif';
  ctx.fillText(dist.name + ' — ' + dist.desc, 812, 126);

  // ---- Left: crew panel ----
  panel(ctx, 12, 142, 250, 132);
  ctx.fillStyle = '#ff7a2f';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('CREW — 3', 24, 162);
  state.crew.forEach((c, i) => {
    const y = 184 + i * 30;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(c.name, 24, y);
    ctx.fillStyle = '#ffd166';
    ctx.font = '11px sans-serif';
    ctx.fillText(c.role + ' — ' + c.bonus, 24, y + 13);
  });

  // ---- Left: district standing bars ----
  panel(ctx, 12, 286, 250, 218);
  ctx.fillStyle = '#ff7a2f';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('DISTRICT STANDING 0–100', 24, 306);
  state.standing.forEach((v, i) => {
    const d = DISTRICTS[i];
    const eff = standingEffect(v);
    const y = 322 + i * 24;
    ctx.fillStyle = d.color;
    ctx.fillRect(24, y, 12, 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText(d.name, 42, y + 10);
    bar(ctx, 150, y, 72, 12, v / 100, d.color, '');
    ctx.fillStyle = eff.label === 'HOSTILE' ? '#ff6b5e' : '#ffb37a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(v + ' ' + eff.label, 228, y + 10);
  });
  ctx.fillStyle = '#ffb37a';
  ctx.font = '11px sans-serif';
  ctx.fillText('Standing changes police, payout & prices.', 24, 496);

  // ---- Bottom-left: radio + clock + day/night ----
  panel(ctx, 12, 516, 250, 92);
  const radio = RADIO[state.radioStation];
  ctx.fillStyle = '#ff7a2f';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('📻 ' + radio.name, 24, 538);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.fillText(radio.desc, 24, 556);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('🕐 ' + formatClock(state.timeOfDay) + '  ·  ' + dayPhase(state.timeOfDay) + '  ·  DAY 1', 24, 578);
  ctx.fillStyle = '#ffb37a';
  ctx.font = '11px sans-serif';
  ctx.fillText('[R] radio   [M] mute   [G] garage/shop   [E] enter car', 24, 598);

  // ---- Bottom-center: win / lose + controls ----
  panel(ctx, 274, 636, 732, 72);
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('WIN: finish 12 missions + reach $50,000', 286, 660);
  ctx.fillStyle = '#ff6b5e';
  ctx.fillText('LOSE: busted (health 0 in a chase) or wrecked', 286, 680);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD/Arrows drive & walk · SPACE handbrake · F / CLICK shoot · E steal car · ' + crewStatusLine(state), 286, 698);

  // ---- Bottom-right: minimap ----
  drawMinimap(ctx, state, city, 1018, 516, 250, 192);

  // ---- Toasts ----
  let ty = 150;
  for (const t of state.toasts) {
    ctx.fillStyle = 'rgba(10,6,4,0.8)';
    ctx.fillRect(500, ty, 280, 26);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(t.text, 510, ty + 18);
    ty += 30;
  }

  // ---- Busted / win banners ----
  if (state.busted) {
    banner(ctx, 'BUSTED!', 'Captain Voss got you. Press R to restart the run.', '#ff3b30');
  } else if (state.won) {
    banner(ctx, 'ASHFALL KING!', 'All 12 missions done — Cinder Bay is yours. Score ' + Math.floor(state.score).toLocaleString('en-US'), '#37d67a');
  } else if (state.paused && !state.shotMode) {
    banner(ctx, 'PAUSED', 'Press P to resume · Esc for menu', '#ffd166');
  }
  void time;
}

function bar(ctx, x, y, w, h, frac, color, label) {
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
  if (label) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText(label, x + 4, y + h - 2);
  }
}

function dayPhase(hour) {
  if (hour < 5.5 || hour >= 19) return 'NIGHT — ember glow';
  if (hour < 7.5) return 'DAWN';
  if (hour < 17.5) return 'DAY — ash haze';
  return 'DUSK — lava light';
}

function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  }
  return DISTRICTS[4];
}

function drawMinimap(ctx, state, city, x, y, w, h) {
  panel(ctx, x, y, w, h);
  ctx.fillStyle = '#ff7a2f';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('MINIMAP — CINDER BAY', x + 10, y + 16);
  const mx = x + 10, my = y + 24, mw = w - 20, mh = h - 34;
  const sx = mw / WORLD, sy = mh / WORLD;
  // Island base + districts.
  ctx.fillStyle = '#241812';
  ctx.fillRect(mx, my, mw, mh);
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.color + '55';
    ctx.fillRect(mx + d.x * sx, my + d.y * sy, d.w * sx, d.h * sy);
  }
  // Lava river.
  ctx.fillStyle = '#ff5a1f';
  for (const l of city.lava) ctx.fillRect(mx + l.x * sx - 1, my + l.y * sy - 1, 3, 3);
  // Roads.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  for (const r of city.roads) {
    if (r.diagonal) continue;
    ctx.beginPath();
    ctx.moveTo(mx + r.x1 * sx, my + r.y1 * sy);
    ctx.lineTo(mx + r.x2 * sx, my + r.y2 * sy);
    ctx.stroke();
  }
  // Mission waypoint.
  const st = state.missionStage;
  if (st) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(mx + st.x * sx, my + st.y * sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(mx + st.x * sx, my + st.y * sy, 8, 0, Math.PI * 2); ctx.stroke();
  }
  // Garages / shops.
  ctx.fillStyle = '#37d67a';
  for (const g of city.garages) ctx.fillRect(mx + g.x * sx - 2, my + g.y * sy - 2, 4, 4);
  ctx.fillStyle = '#4fc3f7';
  for (const s of city.shops) ctx.fillRect(mx + s.x * sx - 2, my + s.y * sy - 2, 4, 4);
  // Police + heli (lookout bonus shows them).
  if (state.crew[2].active) {
    ctx.fillStyle = '#2d7dff';
    for (const c of state.police) {
      ctx.beginPath(); ctx.arc(mx + c.x * sx, my + c.y * sy, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (state.heli) {
      ctx.fillStyle = '#ff6b5e';
      ctx.beginPath(); ctx.arc(mx + state.heli.x * sx, my + state.heli.y * sy, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Player arrow.
  ctx.save();
  ctx.translate(mx + state.player.x * sx, my + state.player.y * sy);
  ctx.rotate(state.player.angle);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffb37a';
  ctx.font = '10px sans-serif';
  ctx.fillText('◆ mission   ■ garage   ■ shop   ● police   ▲ AIR ONE', x + 10, y + h - 6);
}

function banner(ctx, title, sub, color) {
  ctx.fillStyle = 'rgba(10,6,4,0.82)';
  ctx.fillRect(340, 280, 600, 130);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(340, 280, 600, 130);
  ctx.fillStyle = color;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 340);
  ctx.fillStyle = '#ffffff';
  ctx.font = '15px sans-serif';
  ctx.fillText(sub, 640, 380);
  ctx.textAlign = 'left';
}
