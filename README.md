# CINDER BAY — Ashfall Isle

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![Rank](https://make.fun/badge/gta6-01/lusiana27/gta6-01-round10/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![Reward](https://make.fun/badge/gta6-01/lusiana27/gta6-01-round10/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**12 missions, 7 districts, 3 crew — one volcanic island, one crew, one crown.**

An open-world crime game in the spirit of GTA 6, built for the [make.fun "Make GTA 6" bounty](https://make.fun/bounty/gta6-01). Original city, characters, vehicles, names, story, art and music — nothing from any commercial game.

## The island

Cinder Bay is a volcanic island city: lava rivers run from the Caldera crater to the Blacksand beach, ash drifts through orange dusk, and seven districts each answer to you differently. Win a district's standing and the police go easy, missions pay 25% more and shops cut prices 15%. Lose it and the island turns hostile.

## The one deep mechanic: crew + district standing

- **3 crew, always on screen:** JUNO REYES (driver, +18% top speed), KAI TANAKA (hacker, wanted decays 2x, roadblocks glitch), LENA ORTIZ (lookout, police and Air One on the minimap).
- **7 districts, standing 0–100 each:** Emberport, Ashfall Row, Caldera, Slag Market, Cinder Core, Magma Flats, Blacksand. Every mission moves the standing of the district where it ends — and standing changes police patience, payout and shop prices everywhere in that district.
- **12 staged missions:** every mission has 3 stages with its own checkpoint, label and payout — from the "Ember Run" smuggle to the final "Ashfall King" tour of the whole island.

## What's in the game

- A city to explore on foot and by car — steal any traffic car with E
- Wanted level 0–5 stars: police interceptors chase, Captain Voss's **Air One** helicopter circles at 3+ stars, roadblocks at 4+
- Traffic, pedestrians who scatter, day/night cycle (ash-haze day, lava-light dusk, ember night)
- 4 procedural radio stations (WebAudio, no files), engine and siren sounds
- Garage and shops: repairs, armor, engine upgrades, bribes to clear the heat
- HUD with minimap: mission + stage, wanted stars, score + best, cash, health, armor, speed, crew, all 7 standing bars, radio, clock — and WIN / LOSE written on screen
- Automatic save (localStorage) — continue your run from the title screen

## How to play

```
WASD / Arrows — drive & walk      E — steal / exit car
SPACE — handbrake                 F / CLICK — shoot
R — cycle radio                   G — garage / shop menu
M — mute                          P — pause
```

WIN: finish all 12 missions and reach $50,000. LOSE: busted or wrecked.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests — `game/index.html` is plain static files. `main.ts` (Node 22) hands the game in: it copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

## Screenshots

The cover is a 5-star chase at dusk: Air One overhead, a roadblock ahead, mission 3 stage 2 on the HUD. The other three: a night sensor run at the volcano, a checkpoint race down the lava road, and street level in Slag Market.

## Structure

The source is split by job so the outline reads cleanly: `city.js` builds the island, `missions.js` holds the 12 staged missions, `crew.js` the crew and standing, `vehicles.js` traffic / police / Air One / roadblocks, `peds.js` pedestrians, `render.js` the world painter, `hud.js` the HUD and minimap, `audio.js` procedural radio, `save.js` persistence, `shots.js` the four staged screenshot scenes, `main.js` the loop.

## License

MIT — see [LICENSE](LICENSE).

Play it on make.fun: https://make.fun/r/j11vkafs
