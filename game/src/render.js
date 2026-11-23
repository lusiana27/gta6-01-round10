// World rendering: volcanic island ground, lava river, volcano crater, roads,
// buildings with lit windows, props, drifting ash and embers, day/night light.
import { clamp, lerp } from './rng.js';
import { WORLD, DISTRICTS } from './city.js';

// Palette by hour: 6-18 day (ember dusk), night is deep orange-black.
export function skyColors(hour) {
  const night = hour < 5.5 || hour >= 19;
  const dusk = (hour >= 5.5 && hour < 7.5) || (hour >= 17.5 && hour < 19);
  if (night) return { ground: '#1c0f0a', road: '#241812', glow: 0.9, sky: '#160a08' };
  if (dusk) return { ground: '#3a1e10', road: '#4a2a16', glow: 0.55, sky: '#5a2410' };
  return { ground: '#4a2c18', road: '#5d3a20', glow: 0.25, sky: '#7a3a18' };
}

export function drawWorld(ctx, city, state, cam, view, time) {
  const pal = skyColors(state.timeOfDay);
  const { x: cx, y: cy, w, h } = view;
  ctx.fillStyle = pal.ground;
  ctx.fillRect(cx, cy, w, h);

  // District tint bands, so the minimap and the world agree on the island's zones.
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.color + '14';
    ctx.fillRect(d.x, d.y, d.w, d.h);
  }

  // Lava river: glowing blobs with a pulsing core.
  for (const l of city.lava) {
    const pulse = 0.75 + 0.25 * Math.sin(time * 2 + l.x * 0.01);
    ctx.fillStyle = 'rgba(255, 90, 20, ' + (0.85 * pulse).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 210, 80, ' + (0.7 * pulse).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r * 0.45, 0, Math.PI * 2); ctx.fill();
  }

  // Volcano crater: dark cone, glowing rim, smoke.
  const v = city.volcano;
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath(); ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0f08';
  ctx.beginPath(); ctx.arc(v.x, v.y, v.r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 110, 30, 0.9)';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(v.x, v.y, v.r * 0.62, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 140, 40, 0.95)';
  ctx.beginPath(); ctx.arc(v.x, v.y, v.r * 0.3, 0, Math.PI * 2); ctx.fill();

  // Roads.
  ctx.strokeStyle = pal.road;
  ctx.lineWidth = 34;
  ctx.lineCap = 'round';
  for (const r of city.roads) {
    ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
  }
  // Centre dashes.
  ctx.strokeStyle = 'rgba(255, 200, 90, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 22]);
  for (const r of city.roads) {
    if (r.diagonal) continue;
    ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Sidewalk blocks between roads.
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let gx = 0; gx < 10; gx++) {
    for (let gy = 0; gy < 10; gy++) {
      ctx.fillRect(gx * 320 + 184, gy * 320 + 184, 112, 112);
    }
  }

  // Buildings with lit windows and roof labels.
  for (const b of city.buildings) {
    if (b.x > cx + w + 80 || b.x + b.w < cx - 80 || b.y > cy + h + 80 || b.y + b.h < cy - 80) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(b.x + 5, b.y + 6, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
    if (b.lit) {
      ctx.fillStyle = 'rgba(255, 190, 90, 0.85)';
      const cols = Math.max(1, Math.floor(b.w / 26));
      const rows = Math.max(1, Math.floor(b.h / 26));
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if ((i * 7 + j * 3 + b.height) % 3 !== 0) continue;
          ctx.fillRect(b.x + 8 + i * 24, b.y + 8 + j * 24, 10, 12);
        }
      }
    }
  }

  // Props.
  for (const p of city.props) {
    if (p.x < cx - 40 || p.x > cx + w + 40 || p.y < cy - 40 || p.y > cy + h + 40) continue;
    if (p.kind === 'palm') {
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 4, p.y - 16); ctx.stroke();
      ctx.fillStyle = '#2f7a3a';
      ctx.beginPath(); ctx.arc(p.x + 4, p.y - 20, 9, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'lamp') {
      ctx.fillStyle = '#222';
      ctx.fillRect(p.x - 2, p.y - 14, 4, 14);
      ctx.fillStyle = 'rgba(255, 220, 130, 0.95)';
      ctx.beginPath(); ctx.arc(p.x, p.y - 16, 5, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'crate') {
      ctx.fillStyle = '#7a5a2f';
      ctx.fillRect(p.x - 7, p.y - 7, 14, 14);
      ctx.strokeStyle = '#4a3517'; ctx.strokeRect(p.x - 7, p.y - 7, 14, 14);
    } else if (p.kind === 'billboard') {
      ctx.fillStyle = '#1c1c22';
      ctx.fillRect(p.x - 26, p.y - 18, 52, 30);
      ctx.fillStyle = '#ff7a2f';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('CINDER', p.x - 22, p.y - 6);
      ctx.fillStyle = '#ffd166';
      ctx.fillText('BAY 88.1', p.x - 22, p.y + 6);
    } else {
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(p.x - 4, p.y - 6, 8, 12);
    }
  }

  // Garage and shop markers.
  drawSite(ctx, city.garages, '#37d67a', 'GARAGE');
  drawSite(ctx, city.shops, '#4fc3f7', 'SHOP');

  // Mission waypoint beacon.
  const st = state.missionStage;
  if (st && !state.won) {
    const bob = Math.sin(time * 4) * 8;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(st.x, st.y + bob, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    ctx.beginPath(); ctx.arc(st.x, st.y + bob, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(st.x, st.y - 52 + bob); ctx.lineTo(st.x - 12, st.y - 30 + bob); ctx.lineTo(st.x + 12, st.y - 30 + bob); ctx.fill();
  }

  // Drifting ash and embers near the camera.
  drawAsh(ctx, cam, time, pal.glow);
  void lerp; void clamp;
}

function drawSite(ctx, sites, color, label) {
  for (const s of sites) {
    ctx.fillStyle = color;
    ctx.fillRect(s.x - 18, s.y - 18, 36, 36);
    ctx.fillStyle = '#101010';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, s.x, s.y + 3);
    ctx.fillStyle = color;
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(s.name, s.x, s.y - 26);
    ctx.textAlign = 'left';
  }
}

export function drawAsh(ctx, cam, time, glow) {
  const n = 26;
  for (let i = 0; i < n; i++) {
    const x = cam.x + ((i * 173 + time * (12 + i)) % 1280);
    const y = cam.y + ((i * 311 + time * (20 + i * 2)) % 720);
    const ember = i % 3 === 0;
    ctx.fillStyle = ember ? 'rgba(255, ' + (120 + (i % 60)) + ', 30, ' + (0.5 + glow * 0.4).toFixed(2) + ')'
                          : 'rgba(200, 190, 180, 0.35)';
    ctx.beginPath(); ctx.arc(x, y, ember ? 2.6 : 1.6, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawCar(ctx, x, y, angle, color, label, siren) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-20, -10, 44, 24);
  ctx.fillStyle = color;
  ctx.fillRect(-22, -12, 44, 24);
  ctx.fillStyle = '#18202a';
  ctx.fillRect(-6, -10, 14, 20);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(20, -10, 3, 5); ctx.fillRect(20, 5, 3, 5);
  ctx.fillStyle = '#ff3b30';
  ctx.fillRect(-23, -10, 3, 5); ctx.fillRect(-23, 5, 3, 5);
  if (siren) {
    const on = Math.sin(siren) > 0;
    ctx.fillStyle = on ? '#ff2d2d' : '#2d7dff';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (label) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 22);
    ctx.textAlign = 'left';
  }
}

export function drawPed(ctx, p, time) {
  const bob = Math.sin(time * 8 + p.phase) * 1.5;
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y + bob, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1c1410';
  ctx.beginPath(); ctx.arc(p.x, p.y + bob - 4, 3.4, 0, Math.PI * 2); ctx.fill();
}
