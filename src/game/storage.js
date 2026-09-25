const STORAGE_KEY = 'your-brain-is-lying-player';

const DEFAULT_PLAYER = {
  xp: 0,
  level: 1,
  bestReaction: null,
  bestMemoryScore: 0,
  bestAttentionScore: 0,
  bestLogicScore: 0,
  bestImpulseAccuracy: 0,
  totalRuns: 0,
  totalMemoryRuns: 0,
  totalAttentionRuns: 0,
  totalLogicRuns: 0,
  totalImpulseRuns: 0,
  lastRun: null,
  lastMemoryRun: null,
  lastAttentionRun: null,
  lastLogicRun: null,
  lastImpulseRun: null,
  runHistory: [],
  skillMastery: {
    reaction: 0,
    memory: 0,
    attention: 0,
    logic: 0,
    impulse: 0,
  },
};

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function safeMastery(value) {
  return Math.max(0, Math.min(100, safeNumber(value)));
}

export function loadPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER };

    const parsed = JSON.parse(raw);
    const parsedMastery = parsed.skillMastery || {};
    const parsedHistory = Array.isArray(parsed.runHistory)
      ? parsed.runHistory
        .filter((entry) => entry && entry.type && entry.at)
        .slice(0, 25)
      : [];

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
      bestLogicScore: safeNumber(parsed.bestLogicScore),
      bestImpulseAccuracy: safeNumber(parsed.bestImpulseAccuracy),
      totalRuns: safeNumber(parsed.totalRuns),
      totalMemoryRuns: safeNumber(parsed.totalMemoryRuns),
      totalAttentionRuns: safeNumber(parsed.totalAttentionRuns),
      totalLogicRuns: safeNumber(parsed.totalLogicRuns),
      totalImpulseRuns: safeNumber(parsed.totalImpulseRuns),
      runHistory: parsedHistory,
      skillMastery: {
        reaction: safeMastery(parsedMastery.reaction),
        memory: safeMastery(parsedMastery.memory),
        attention: safeMastery(parsedMastery.attention),
        logic: safeMastery(parsedMastery.logic),
        impulse: safeMastery(parsedMastery.impulse),
      },
    };
  } catch {
    return { ...DEFAULT_PLAYER };
  }
}

export function appendRunHistory(player, result) {
  if (!result?.type) return player;

  const at = result.at || new Date().toISOString();
  const metricMap = {
    reaction: result.best ? result.best + ' ms' : '—',
    memory: result.score !== undefined ? result.score + '/5 · ' + (result.accuracy || 0) + '%' : '—',
    attention: result.score !== undefined ? result.score + '/5 · ' + (result.average || 0) + ' ms' : '—',
    logic: result.score !== undefined ? result.score + '/5 · ' + (result.accuracy || 0) + '%' : '—',
    impulse: result.accuracy !== undefined ? result.accuracy + '% · ' + (result.falseAlarmRate || 0) + '% FA' : '—',
  };
  const labelMap = {
    reaction: 'Reaction',
    memory: 'Memory',
    attention: 'Attention',
    logic: 'Logic',
    impulse: 'Impulse',
  };

  const entry = {
    id: at + '-' + result.type,
    type: result.type,
    label: labelMap[result.type] || result.type,
    metric: metricMap[result.type] || '—',
    xp: Math.max(0, Number(result.xp) || 0),
    at,
  };

  return {
    ...player,
    runHistory: [entry, ...(player.runHistory || [])].slice(0, 25),
  };
}

export function savePlayer(player) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}
