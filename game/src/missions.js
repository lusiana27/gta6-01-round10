// 12 staged missions. Every mission has 3 stages; each stage is a drive-to
// checkpoint with its own label, district and payout. Finish all 12 to win.
import { DISTRICTS } from './city.js';

const M = (name, giver, brief, stages) => ({ name, giver, brief, stages });

export const MISSIONS = [
  M('EMBER RUN', 'JUNO REYES', 'Smuggle ember-glass across the island before the ash storm hits.',
    [{ x: 480, y: 480, label: 'PICK UP the ember-glass at Emberport docks', district: 0 },
     { x: 1440, y: 1440, label: 'THREAD the Cinder Core checkpoints', district: 4 },
     { x: 2650, y: 900, label: 'DELIVER to the Caldera lookout', district: 2 }]),
  M('ASHFALL TAXI', 'LENA ORTIZ', 'Three fares, one night, no questions asked.',
    [{ x: 1280, y: 320, label: 'PICK UP fare 1/3 in Ashfall Row', district: 1 },
     { x: 800, y: 1760, label: 'PICK UP fare 2/3 at Slag Market', district: 3 },
     { x: 640, y: 2720, label: 'DROP all fares at Blacksand Pier', district: 6 }]),
  M('LAVA LINE', 'KAI TANAKA', 'Race the lava flow: three checkpoints, one straight shot east.',
    [{ x: 1760, y: 480, label: 'CHECKPOINT 1/3 — Ashfall gate', district: 1 },
     { x: 2400, y: 1120, label: 'CHECKPOINT 2/3 — Magma Flats', district: 5 },
     { x: 3040, y: 1760, label: 'CHECKPOINT 3/3 — refinery finish', district: 5 }]),
  M('SLAG HEIST', 'JUNO REYES', 'Lift the refinery payroll and vanish into the bazaar.',
    [{ x: 2560, y: 1440, label: 'CRACK the payroll van at Magma Flats', district: 5 },
     { x: 480, y: 1440, label: 'SHAKE the tail through Slag Market', district: 3 },
     { x: 640, y: 1440, label: "STASH the cash at JUNO'S GARAGE", district: 3 }]),
  M('PIER PRESSURE', 'LENA ORTIZ', 'The pier boss wants his cut. Deliver it — loudly.',
    [{ x: 320, y: 2560, label: 'COLLECT the cut at Pier 9', district: 6 },
     { x: 1600, y: 2560, label: 'OUTRUN the boardwalk patrol', district: 6 },
     { x: 1440, y: 1440, label: 'HAND OVER at Cinder Core plaza', district: 4 }]),
  M('CALDERA CLIMB', 'KAI TANAKA', 'Plant three sensors on the volcano rim while it rumbles.',
    [{ x: 2400, y: 320, label: 'SENSOR 1/3 — north rim', district: 2 },
     { x: 2880, y: 320, label: 'SENSOR 2/3 — east rim', district: 2 },
     { x: 2650, y: 640, label: 'SENSOR 3/3 — crater overlook', district: 2 }]),
  M('NIGHT BAZAAR', 'JUNO REYES', 'Move three crates through the bazaar without stopping.',
    [{ x: 320, y: 1280, label: 'CRATE 1/3 — Slag Market west', district: 3 },
     { x: 800, y: 1600, label: 'CRATE 2/3 — market square', district: 3 },
     { x: 1120, y: 1920, label: 'CRATE 3/3 — south gate', district: 3 }]),
  M('CORE PURSUIT', 'LENA ORTIZ', 'A rival crew is racing downtown. Beat them to the plaza.',
    [{ x: 1280, y: 1280, label: 'CUT THROUGH Cinder Core north', district: 4 },
     { x: 1760, y: 1760, label: 'CHECKPOINT — tower loop', district: 4 },
     { x: 1440, y: 1440, label: 'FINISH at the plaza first', district: 4 }]),
  M('BLACKSAND DRIFT', 'KAI TANAKA', 'Drift the whole beach road, checkpoints on the sand.',
    [{ x: 480, y: 2400, label: 'CHECKPOINT 1/3 — west beach', district: 6 },
     { x: 1600, y: 2620, label: 'CHECKPOINT 2/3 — boardwalk', district: 6 },
     { x: 2880, y: 2880, label: 'CHECKPOINT 3/3 — east pier', district: 6 }]),
  M('EMBERPORT SIEGE', 'JUNO REYES', 'Five stars, one harbour, no way out but through.',
    [{ x: 320, y: 320, label: 'BREAK the dock blockade', district: 0 },
     { x: 800, y: 800, label: 'ESCAPE through Ashfall Row', district: 1 },
     { x: 1440, y: 1440, label: 'REGROUP at Cinder Core', district: 4 }]),
  M('VOLCANO VAULT', 'LENA ORTIZ', 'The vault under the Caldera holds the island\'s gold.',
    [{ x: 2400, y: 800, label: 'CRACK the vault door', district: 2 },
     { x: 2400, y: 1440, label: 'HAUL the gold south', district: 5 },
     { x: 480, y: 2560, label: 'BURY it at Pier 9', district: 6 }]),
  M('ASHFALL KING', 'KAI TANAKA', 'Final run: every district, one night, the whole island watching.',
    [{ x: 480, y: 480, label: 'LEG 1/3 — Emberport salute', district: 0 },
     { x: 2650, y: 320, label: 'LEG 2/3 — Caldera crown', district: 2 },
     { x: 1600, y: 2720, label: 'LEG 3/3 — Blacksand coronation', district: 6 }]),
];

export const MISSION_PAYOUTS = [1200, 900, 1500, 2600, 1400, 1800, 1100, 2000, 1300, 3200, 4200, 8000];

export function missionState(index) {
  return { index, stage: 0, done: false };
}

export function currentMission(state) {
  return MISSIONS[state.mission.index];
}

export function currentStage(state) {
  const m = currentMission(state);
  return m.stages[state.mission.stage];
}

export function missionLabel(state) {
  const m = currentMission(state);
  return 'MISSION ' + (state.mission.index + 1) + '/12 — ' + m.name + ', STAGE ' + (state.mission.stage + 1) + '/3';
}

export function districtName(id) {
  return DISTRICTS[id] ? DISTRICTS[id].name : 'CINDER BAY';
}
