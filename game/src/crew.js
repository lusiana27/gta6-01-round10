// Crew of three + district standing. Standing 0-100 per district changes how the
// island treats you: police patience, mission payout and shop prices.
import { clamp } from './rng.js';

export const CREW = [
  { name: 'JUNO REYES',  role: 'DRIVER',  bonus: '+18% top speed, sharper handling', active: true },
  { name: 'KAI TANAKA',  role: 'HACKER',  bonus: 'Wanted decays 2x, roadblocks glitch', active: true },
  { name: 'LENA ORTIZ',  role: 'LOOKOUT', bonus: 'Police + heli shown on minimap', active: true },
];

export function freshStanding() {
  // Start: the crew is known in Emberport, strangers everywhere else.
  return [62, 48, 22, 55, 40, 30, 45];
}

export function standingEffect(standing) {
  if (standing >= 70) return { label: 'TRUSTED', police: 0.55, payout: 1.25, price: 0.85 };
  if (standing >= 45) return { label: 'KNOWN', police: 0.8, payout: 1.1, price: 0.95 };
  if (standing >= 25) return { label: 'STRANGER', police: 1.0, payout: 1.0, price: 1.0 };
  return { label: 'HOSTILE', police: 1.35, payout: 0.85, price: 1.2 };
}

export function bumpStanding(standing, districtId, delta) {
  standing[districtId] = clamp(Math.round(standing[districtId] + delta), 0, 100);
}

export function crewBonus(state, kind) {
  if (kind === 'speed') return state.crew[0].active ? 1.18 : 1;
  if (kind === 'wantedDecay') return state.crew[1].active ? 2 : 1;
  if (kind === 'lookout') return state.crew[2].active ? 1 : 0;
  return 1;
}

// A one-line crew status for the HUD.
export function crewStatusLine(state) {
  return state.crew.map(c => c.name.split(' ')[0] + '·' + c.role).join('  ');
}
