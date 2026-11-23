// Screenshot scenes: deterministic staged setups so each of the 4 screenshots
// is mid-action with a full HUD. ?shot=1..4 in the URL picks one; the game then
// autopilots a few seconds and freezes on the money frame.
import { currentStage, MISSION_PAYOUTS } from './missions.js';
import { spawnPolice, makeHeli, spawnRoadblock } from './vehicles.js';

export function applyShot(state, n) {
  state.shotMode = true;
  state.screen = 'playing';
  state.timeOfDay = 18.4;
  const P = state.player;

  if (n === 1) {
    // COVER: 5-star chase at dusk — Air One overhead, roadblock ahead, mission 3 stage 2.
    state.mission.index = 2; state.mission.stage = 1;
    state.wanted = 5; state.heat = 96;
    state.cash = 18450; state.score = 48230;
    P.x = 1760; P.y = 800; P.angle = 0; P.inCar = true; P.speed = 210;
    P.carColor = '#ff7a2f'; state.carName = 'EMBER GT';
    state.police = spawnPolice(state.city, P.x, P.y, 4, 4242);
    state.police[0].x = P.x - 260; state.police[0].y = P.y - 40;
    state.police[1].x = P.x - 300; state.police[1].y = P.y + 60;
    state.police[2].x = P.x + 180; state.police[2].y = P.y - 220;
    state.police[3].x = P.x - 140; state.police[3].y = P.y + 240;
    state.heli = makeHeli(P.x, P.y);
    state.roadblock = spawnRoadblock(state.city, P.x, P.y, 0);
    state.standing = [78, 64, 55, 71, 66, 48, 58];
    state.timeOfDay = 18.4;
    state.toasts = [{ text: '★ WANTED 5 — CAPTAIN VOSS IS ON YOU', ttl: 9 }];
  } else if (n === 2) {
    // NIGHT at the volcano: sensor run, ember glow, 2 stars.
    state.mission.index = 5; state.mission.stage = 0;
    state.wanted = 2; state.heat = 41;
    state.cash = 9200; state.score = 21480;
    P.x = 2400; P.y = 480; P.angle = 0; P.inCar = true; P.speed = 120;
    P.carColor = '#4fc3f7'; state.carName = 'ASH COUPE';
    state.police = spawnPolice(state.city, P.x, P.y, 2, 777);
    state.heli = null; state.roadblock = null;
    state.standing = [66, 52, 38, 58, 44, 33, 47];
    state.timeOfDay = 22.2;
    state.toasts = [{ text: 'NIGHT — the Caldera glows. Sensors 1/3.', ttl: 9 }];
  } else if (n === 3) {
    // CHECKPOINT RACE: Lava Line stage 1, full speed down the east road.
    state.mission.index = 2; state.mission.stage = 0;
    state.wanted = 1; state.heat = 18;
    state.cash = 5400; state.score = 12800;
    P.x = 1560; P.y = 480; P.angle = 0; P.inCar = true; P.speed = 300;
    P.carColor = '#ffd166'; state.carName = 'LAVA LIMO';
    state.police = spawnPolice(state.city, P.x, P.y, 1, 3131);
    state.heli = null; state.roadblock = null;
    state.standing = [60, 50, 30, 52, 42, 36, 44];
    state.timeOfDay = 10.5;
    state.toasts = [{ text: 'CHECKPOINT RACE — beat the lava to the refinery!', ttl: 9 }];
  } else {
    // STREET LEVEL: on foot in Slag Market, clean, shop + garage nearby.
    state.mission.index = 6; state.mission.stage = 1;
    state.wanted = 0; state.heat = 0;
    state.cash = 7300; state.score = 9860;
    P.x = 720; P.y = 1560; P.angle = 0.8; P.inCar = false; P.speed = 0;
    state.police = []; state.heli = null; state.roadblock = null;
    state.standing = [70, 58, 26, 82, 48, 31, 52];
    state.timeOfDay = 14.0;
    state.toasts = [{ text: 'SLAG MARKET trusts you — prices down 15%.', ttl: 9 }];
  }
  state.missionStage = currentStage(state);
  state.inCar = state.player.inCar;
  state.speedKmh = Math.abs(state.player.speed || 0) * 0.9;
}
