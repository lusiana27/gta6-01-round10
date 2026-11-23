// Vehicles: traffic cars, police interceptors, Captain Voss's Air One helicopter
// and roadblocks. All of them drive the same road grid the player does.
import { makeRng, range, rangeInt, pick, clamp, dist, angleLerp, angleTo } from './rng.js';
import { nearestRoadPoint, WORLD } from './city.js';

const TRAFFIC_COLORS = ['#d8d8d8', '#e8b64c', '#7fb3d5', '#c0392b', '#27ae60', '#8e44ad', '#f39c12', '#95a5a6'];
const CAR_NAMES = ['EMBER TAXI', 'SLAG VAN', 'ASH COUPE', 'PIER PICKUP', 'CORE SEDAN', 'LAVA LIMO'];

export function spawnTraffic(city, seed, count) {
  const rng = makeRng(seed + 77);
  const cars = [];
  for (let i = 0; i < count; i++) {
    const p = nearestRoadPoint(city, range(rng, 100, WORLD - 100), range(rng, 100, WORLD - 100));
    cars.push({
      x: p.x, y: p.y, angle: p.vertical ? Math.PI / 2 : 0,
      speed: range(rng, 60, 130), color: pick(rng, TRAFFIC_COLORS),
      name: pick(rng, CAR_NAMES), vertical: p.vertical, dir: rng() < 0.5 ? 1 : -1,
      wobble: range(rng, 0, Math.PI * 2), turnRng: makeRng(seed + 77 + i * 13),
    });
  }
  return cars;
}

export function updateTraffic(city, cars, dt, time) {
  for (const c of cars) {
    const target = c.vertical ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI);
    c.angle = angleLerp(c.angle, target, Math.min(1, dt * 2));
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt + Math.sin(time * 2 + c.wobble) * 6 * dt;
    if (c.x < 40 || c.x > WORLD - 40 || c.y < 40 || c.y > WORLD - 40) {
      const p = nearestRoadPoint(city, WORLD / 2 + rangeInt(makeRng((time * 1000) | 0 + cars.indexOf(c)), -800, 800), WORLD / 2);
      c.x = p.x; c.y = p.y; c.vertical = p.vertical;
    }
    // Turn at intersections sometimes: flip axis at grid lines.
    if (Math.abs(((c.vertical ? c.y : c.x) % 320) - 160) < 4 && c.turnRng() < 0.002) {
      c.vertical = !c.vertical;
    }
  }
}

export function spawnPolice(city, x, y, count, seed) {
  const rng = makeRng(seed + 991);
  const cops = [];
  for (let i = 0; i < count; i++) {
    const p = nearestRoadPoint(city, x + range(rng, -500, 500), y + range(rng, -500, 500));
    cops.push({
      x: p.x, y: p.y, angle: angleTo(p.x, p.y, x, y),
      speed: 0, maxSpeed: 300 + range(rng, 0, 60),
      color: '#1c3f94', siren: rng() * Math.PI * 2, id: 'UNIT ' + (i + 1),
    });
  }
  return cops;
}

export function updatePolice(cops, px, py, dt, wanted) {
  for (const c of cops) {
    const a = angleTo(c.x, c.y, px, py);
    c.angle = angleLerp(c.angle, a, Math.min(1, dt * 3));
    const want = c.maxSpeed * (0.55 + wanted * 0.09);
    c.speed = clamp(c.speed + (want - c.speed) * dt * 0.8, 0, c.maxSpeed);
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    c.siren += dt * 9;
  }
}

// Air One: Captain Voss's helicopter. Circles the player, spotlights the chase.
export function makeHeli(x, y) {
  return { x: x + 300, y: y - 300, angle: 0, radius: 260, speed: 0.5, name: 'CAPTAIN VOSS — AIR ONE' };
}

export function updateHeli(heli, px, py, dt, time) {
  heli.angle += dt * heli.speed;
  heli.x = px + Math.cos(heli.angle) * heli.radius;
  heli.y = py + Math.sin(heli.angle) * heli.radius * 0.8 - 60;
  void time;
}

// Roadblocks: police vans parked across a road ahead of the player.
export function spawnRoadblock(city, px, py, angle) {
  const p = nearestRoadPoint(city, px + Math.cos(angle) * 420, py + Math.sin(angle) * 420);
  const vans = [];
  for (let i = -1; i <= 1; i++) {
    const off = i * 46;
    vans.push({
      x: p.x + (p.vertical ? off : 0), y: p.y + (p.vertical ? 0 : off),
      angle: p.vertical ? 0 : Math.PI / 2, color: '#1c3f94',
    });
  }
  return { x: p.x, y: p.y, vans, ttl: 40 };
}

export function carCollides(a, b, r) {
  return dist(a.x, a.y, b.x, b.y) < r;
}
