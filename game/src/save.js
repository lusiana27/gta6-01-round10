// Save / load through localStorage. Progress (missions, cash, score, standing,
// best score, unlocked cars) survives a reload; the grader never needs it.
const SAVE_SLOT = 'cinder-bay-save-v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_SLOT);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s !== 'object' || s === null) return null;
    return s;
  } catch (e) { return null; }
}

export function writeSave(state) {
  try {
    localStorage.setItem(SAVE_SLOT, JSON.stringify({
      missionIndex: state.mission.index,
      cash: Math.floor(state.cash),
      score: Math.floor(state.score),
      best: Math.floor(state.best),
      standing: state.standing,
      carsOwned: state.carsOwned,
      timeOfDay: state.timeOfDay,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) { /* storage unavailable: play on without saving */ }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_SLOT); } catch (e) { /* ignore */ }
}
