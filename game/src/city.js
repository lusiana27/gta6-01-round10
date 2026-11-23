// Cinder Bay: the volcanic island city. Seven districts, a road grid, lava flows,
// the Caldera volcano, buildings, props and the garage / shop locations.
import { makeRng, range, rangeInt, pick, clamp } from './rng.js';

export const WORLD = 3200;

export const DISTRICTS = [
  { id: 0, name: 'EMBERPORT',   x: 0,    y: 0,    w: 1100, h: 1100, color: '#ff7a2f', desc: 'Docks & fish market' },
  { id: 1, name: 'ASHFALL ROW', x: 1100, y: 0,    w: 1000, h: 1100, color: '#c9a227', desc: 'Old town, ash roofs' },
  { id: 2, name: 'CALDERA',     x: 2100, y: 0,    w: 1100, h: 1100, color: '#ff3b1f', desc: 'Volcano rim, lava view' },
  { id: 3, name: 'SLAG MARKET', x: 0,    y: 1100, w: 1100, h: 1000, color: '#e8638c', desc: 'Night bazaar, chop shops' },
  { id: 4, name: 'CINDER CORE', x: 1100, y: 1100, w: 1000, h: 1000, color: '#ff9e2c', desc: 'Downtown towers' },
  { id: 5, name: 'MAGMA FLATS', x: 2100, y: 1100, w: 1100, h: 1000, color: '#ff5a1f', desc: 'Lava fields, refinery' },
  { id: 6, name: 'BLACKSAND',   x: 0,    y: 2100, w: 3200, h: 1100, color: '#4fc3f7', desc: 'Beach, boardwalk, pier' },
];

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  }
  return DISTRICTS[4];
}

export function buildCity(seed) {
  const rng = makeRng(seed);
  const roads = [];
  // Vertical avenues and horizontal streets on a loose grid.
  for (let x = 160; x < WORLD; x += 320) roads.push({ x1: x, y1: 0, x2: x, y2: WORLD, vertical: true });
  for (let y = 160; y < WORLD; y += 320) roads.push({ x1: 0, y1: y, x2: WORLD, y2: y, vertical: false });
  // Diagonal coast road along the black-sand beach.
  roads.push({ x1: 0, y1: 2380, x2: WORLD, y2: 2900, vertical: false, diagonal: true });

  const buildings = [];
  const palette = ['#3a2a24', '#4a3226', '#2e2620', '#54382a', '#41301f', '#5d4030', '#33241d'];
  for (let gx = 0; gx < 10; gx++) {
    for (let gy = 0; gy < 10; gy++) {
      const bx = gx * 320 + 200, by = gy * 320 + 200;
      const n = rangeInt(rng, 1, 3);
      for (let i = 0; i < n; i++) {
        const w = range(rng, 60, 130), h = range(rng, 60, 130);
        const x = bx + range(rng, -30, 90), y = by + range(rng, -30, 90);
        if (x + w > WORLD - 40 || y + h > WORLD - 40) continue;
        // Keep the volcano crater and the lava river clear.
        if (x > 2400 && y < 500) continue;
        buildings.push({
          x, y, w, h, color: pick(rng, palette),
          roof: pick(rng, ['#6b4a2f', '#7a5a35', '#4a3a2a', '#8a6a3f']),
          height: rangeInt(rng, 1, 6), lit: rng() < 0.7,
          district: districtAt(x + w / 2, y + h / 2).id,
        });
      }
    }
  }

  // Lava river: a jagged flow from the Caldera crater down to the east shore.
  const lava = [];
  let lx = 2650, ly = 120;
  while (ly < 2100) {
    lava.push({ x: lx, y: ly, r: range(rng, 26, 52) });
    lx += range(rng, -70, 70); ly += range(rng, 55, 95);
    lx = clamp(lx, 2350, 3150);
  }
  // Volcano crater.
  const volcano = { x: 2650, y: 330, r: 210 };

  // Props: palm trees, lamps, crates, billboards, hydrants.
  const props = [];
  for (let i = 0; i < 260; i++) {
    props.push({
      x: range(rng, 60, WORLD - 60), y: range(rng, 60, WORLD - 60),
      kind: pick(rng, ['palm', 'palm', 'lamp', 'crate', 'billboard', 'hydrant']),
    });
  }

  const garages = [
    { name: "JUNO'S GARAGE", x: 640, y: 1440, district: 3 },
    { name: 'SLAG PIT MOTORS', x: 1760, y: 800, district: 1 },
    { name: 'PIER 9 CUSTOMS', x: 480, y: 2560, district: 6 },
  ];
  const shops = [
    { name: 'EMBER MART', x: 1440, y: 640, district: 1 },
    { name: 'ASH & AMMO', x: 960, y: 1760, district: 4 },
    { name: 'BLACKSAND SURF', x: 2240, y: 2720, district: 6 },
  ];

  return { roads, buildings, lava, volcano, props, garages, shops, seed };
}

// True when a point sits inside any building (used for collision).
export function hitsBuilding(city, x, y, pad) {
  for (const b of city.buildings) {
    if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return b;
  }
  return null;
}

// Nearest point on the road grid, for traffic spawning and routing.
export function nearestRoadPoint(city, x, y) {
  let best = null, bestD = Infinity;
  for (const r of city.roads) {
    if (r.diagonal) continue;
    let px, py;
    if (r.vertical) { px = r.x1; py = clamp(y, 0, WORLD); }
    else { px = clamp(x, 0, WORLD); py = r.y1; }
    const d = (px - x) * (px - x) + (py - y) * (py - y);
    if (d < bestD) { bestD = d; best = { x: px, y: py, vertical: r.vertical }; }
  }
  return best || { x: 160, y: 160, vertical: true };
}
