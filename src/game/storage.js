const STORAGE_KEY = 'your-brain-is-lying-player';

const DEFAULT_PLAYER = {
  xp: 0,
  level: 1,
  bestReaction: null,
  bestMemoryScore: 0,
  bestAttentionScore: 0,
  totalRuns: 0,
  totalMemoryRuns: 0,
  totalAttentionRuns: 0,
  lastRun: null,
  lastMemoryRun: null,
  lastAttentionRun: null,
};

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function loadPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER };

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_PLAYER,
      ...parsed,
      xp: safeNumber(parsed.xp),
      level: safeNumber(parsed.level, 1),
      bestReaction:
        parsed.bestReaction === null || Number.isFinite(parsed.bestReaction)
          ? parsed.bestReaction
          : null,
      bestMemoryScore: safeNumber(parsed.bestMemoryScore),
      bestAttentionScore: safeNumber(parsed.bestAttentionScore),
      totalRuns: safeNumber(parsed.totalRuns),
      totalMemoryRuns: safeNumber(parsed.totalMemoryRuns),
      totalAttentionRuns: safeNumber(parsed.totalAttentionRuns),
    };
  } catch {
    return { ...DEFAULT_PLAYER };
  }
}

export function savePlayer(player) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}
