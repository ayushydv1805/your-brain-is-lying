import { getEligibleAchievementIds } from './achievementEngine';

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
  activityDates: [],
  currentStreak: 0,
  bestStreak: 0,
  unlockedAchievements: [],
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

function dateKeyFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function normalizeDateKeys(dates) {
  return [...new Set(
    (Array.isArray(dates) ? dates : [])
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)),
  )].sort((a, b) => b.localeCompare(a)).slice(0, 180);
}

function dateKeyToTime(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

function diffDays(later, earlier) {
  return Math.round((dateKeyToTime(later) - dateKeyToTime(earlier)) / 86400000);
}

function getTodayKey() {
  return dateKeyFromTimestamp(new Date().toISOString());
}

export function getStreakStats(activityDates) {
  const sortedAsc = normalizeDateKeys(activityDates).sort((a, b) => a.localeCompare(b));
  if (sortedAsc.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let bestStreak = 1;
  let streak = 1;

  for (let index = 1; index < sortedAsc.length; index += 1) {
    if (diffDays(sortedAsc[index], sortedAsc[index - 1]) === 1) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 1;
    }
  }

  const today = getTodayKey();
  const latest = sortedAsc[sortedAsc.length - 1];
  const latestGap = diffDays(today, latest);
  let currentStreak = 0;

  if (latestGap === 0 || latestGap === 1) {
    currentStreak = 1;
    for (let index = sortedAsc.length - 1; index > 0; index -= 1) {
      if (diffDays(sortedAsc[index], sortedAsc[index - 1]) !== 1) break;
      currentStreak += 1;
    }
  }

  return { currentStreak, bestStreak };
}

function normalizeUnlocked(ids) {
  return [...new Set(
    (Array.isArray(ids) ? ids : [])
      .filter((value) => typeof value === 'string'),
  )];
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

    const recoveredActivityDates =
      Array.isArray(parsed.activityDates) && parsed.activityDates.length > 0
        ? parsed.activityDates
        : parsedHistory.map((entry) => dateKeyFromTimestamp(entry.at));

    const activityDates = normalizeDateKeys(recoveredActivityDates);
    const streak = getStreakStats(activityDates);

    const basePlayer = {
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
      activityDates,
      currentStreak: streak.currentStreak,
      bestStreak: Math.max(safeNumber(parsed.bestStreak), streak.bestStreak),
      unlockedAchievements: normalizeUnlocked(parsed.unlockedAchievements),
      skillMastery: {
        reaction: safeMastery(parsedMastery.reaction),
        memory: safeMastery(parsedMastery.memory),
        attention: safeMastery(parsedMastery.attention),
        logic: safeMastery(parsedMastery.logic),
        impulse: safeMastery(parsedMastery.impulse),
      },
    };

    const eligible = getEligibleAchievementIds(basePlayer);

    return {
      ...basePlayer,
      unlockedAchievements: normalizeUnlocked([
        ...basePlayer.unlockedAchievements,
        ...eligible,
      ]),
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

  const nextHistory = [entry, ...(player.runHistory || [])].slice(0, 25);
  const activityDate = dateKeyFromTimestamp(at);
  const activityDates = normalizeDateKeys([
    ...(player.activityDates || []),
    activityDate,
  ].filter(Boolean));
  const streak = getStreakStats(activityDates);

  const progressPlayer = {
    ...player,
    runHistory: nextHistory,
    activityDates,
    currentStreak: streak.currentStreak,
    bestStreak: Math.max(player.bestStreak || 0, streak.bestStreak),
  };
  const eligible = getEligibleAchievementIds(progressPlayer);

  return {
    ...progressPlayer,
    unlockedAchievements: normalizeUnlocked([
      ...(player.unlockedAchievements || []),
      ...eligible,
    ]),
  };
}

export function savePlayer(player) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}
