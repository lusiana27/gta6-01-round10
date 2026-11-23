// Pedestrians: islanders walking the sidewalks, scattering when a car screams past.
import { makeRng, range, pick, dist, clamp } from './rng.js';
import { WORLD } from './city.js';

const PED_COLORS = ['#ff8c42', '#ffd166', '#7bd389', '#f78fb3', '#6cb4ee', '#e0aaff', '#f4f1de'];

export function spawnPeds(seed, count) {
  const rng = makeRng(seed + 31);
  const peds = [];
  for (let i = 0; i < count; i++) {
    peds.push({
      x: range(rng, 80, WORLD - 80), y: range(rng, 80, WORLD - 80),
      angle: range(rng, 0, Math.PI * 2), speed: range(rng, 14, 34),
      color: pick(rng, PED_COLORS), phase: range(rng, 0, Math.PI * 2),
      scared: 0,
    });
  }
  return peds;
}

export function updatePeds(peds, px, py, playerSpeed, dt, time) {
  for (const p of peds) {
    const d = dist(p.x, p.y, px, py);
    if (d < 130 && playerSpeed > 120) p.scared = 1.2;
    if (p.scared > 0) {
      p.scared -= dt;
      // Run away from the player.
      const a = Math.atan2(p.y - py, p.x - px);
      p.x += Math.cos(a) * 90 * dt;
      p.y += Math.sin(a) * 90 * dt;
    } else {
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (Math.sin(time * 0.4 + p.phase) > 0.996) p.angle += (Math.PI / 2) * (p.phase > 3 ? 1 : -1);
    }
    p.x = clamp(p.x, 40, WORLD - 40);
    p.y = clamp(p.y, 40, WORLD - 40);
  }
}
