const STORAGE_KEY = 'your-brain-is-lying-player';

const DEFAULT_PLAYER = {
  xp: 0,
  level: 1,
  bestReaction: null,
  totalRuns: 0,
  lastRun: null,
};

export function loadPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER };

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_PLAYER,
      ...parsed,
      xp: Number.isFinite(parsed.xp) ? parsed.xp : 0,
      level: Number.isFinite(parsed.level) ? parsed.level : 1,
    };
  } catch {
    return { ...DEFAULT_PLAYER };
  }
}

export function savePlayer(player) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}
