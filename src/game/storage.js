import { getEligibleAchievementIds } from './achievementEngine.js';

const STORAGE_KEY = 'your-brain-is-lying-player';
const ACTIVE_PROFILE_KEY = 'your-brain-is-lying-active-profile';
const MAX_RUN_HISTORY = 500;
const STORAGE_SCHEMA_VERSION = 2;

function getStorageKey() {
  try {
    const profileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return profileId ? STORAGE_KEY + ':' + profileId : STORAGE_KEY;
  } catch {
    return STORAGE_KEY;
  }
}

const DEFAULT_PLAYER = {
  schemaVersion: STORAGE_SCHEMA_VERSION,
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
  dailyChallengeDates: [],
  completedDailyChallenges: 0,
  unlockedAchievements: [],
  skillMastery: { reaction: 0, memory: 0, attention: 0, logic: 0, impulse: 0 },
};

function safeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
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
  return [...new Set((Array.isArray(dates) ? dates : []).filter((value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)))].sort((a, b) => b.localeCompare(a)).slice(0, 180);
}

function dateKeyToTime(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

function diffDays(later, earlier) {
  return Math.round((dateKeyToTime(later) - dateKeyToTime(earlier)) / 86400000);
}

function getTodayKey() {
  return dateKeyFromTimestamp(new Date());
}

export function getStreakStats(activityDates) {
  const sortedAsc = normalizeDateKeys(activityDates).sort((a, b) => a.localeCompare(b));
  if (sortedAsc.length === 0) return { currentStreak: 0, bestStreak: 0 };
  let bestStreak = 1;
  let streak = 1;
  for (let index = 1; index < sortedAsc.length; index += 1) {
    if (diffDays(sortedAsc[index], sortedAsc[index - 1]) === 1) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else streak = 1;
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
  return [...new Set((Array.isArray(ids) ? ids : []).filter((value) => typeof value === 'string'))];
}

function defaultPlayer() {
  return { ...DEFAULT_PLAYER, skillMastery: { ...DEFAULT_PLAYER.skillMastery }, runHistory: [], activityDates: [], dailyChallengeDates: [], unlockedAchievements: [] };
}

function preserveCorruptData(raw, key) {
  try {
    const backupKey = key + ':corrupt-backup-' + new Date().toISOString().replace(/[:.]/g, '-');
    localStorage.setItem(backupKey, raw.slice(0, 2_000_000));
  } catch {
    // Never overwrite the original data when a recovery copy cannot be created.
  }
}

export function getPlayerStorageStatus() {
  const key = getStorageKey();
  try {
    const raw = localStorage.getItem(key);
    return { available: true, hasSavedData: raw !== null, bytes: raw ? new TextEncoder().encode(raw).length : 0, key };
  } catch {
    return { available: false, hasSavedData: false, bytes: 0, key, message: 'Browser storage is unavailable.' };
  }
}

export function loadPlayer() {
  const key = getStorageKey();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultPlayer();
    let parsed;
    try {
      parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid saved player structure');
    } catch {
      preserveCorruptData(raw, key);
      return defaultPlayer();
    }

    const parsedMastery = parsed.skillMastery && typeof parsed.skillMastery === 'object' ? parsed.skillMastery : {};
    const parsedHistory = Array.isArray(parsed.runHistory)
      ? parsed.runHistory.filter((entry) => entry && typeof entry.type === 'string' && entry.at && !Number.isNaN(new Date(entry.at).getTime())).slice(0, MAX_RUN_HISTORY)
      : [];
    const recoveredActivityDates = Array.isArray(parsed.activityDates) && parsed.activityDates.length > 0
      ? parsed.activityDates
      : parsedHistory.map((entry) => dateKeyFromTimestamp(entry.at));
    const activityDates = normalizeDateKeys(recoveredActivityDates);
    const streak = getStreakStats(activityDates);
    const dailyChallengeDates = normalizeDateKeys(parsed.dailyChallengeDates);
    const basePlayer = {
      ...defaultPlayer(),
      ...parsed,
      schemaVersion: STORAGE_SCHEMA_VERSION,
      xp: Math.max(0, safeNumber(parsed.xp)),
      level: Math.max(1, safeNumber(parsed.level, 1)),
      bestReaction: parsed.bestReaction == null ? null : Math.max(0, safeNumber(parsed.bestReaction, null)),
      bestMemoryScore: Math.max(0, safeNumber(parsed.bestMemoryScore)),
      bestAttentionScore: Math.max(0, safeNumber(parsed.bestAttentionScore)),
      bestLogicScore: Math.max(0, safeNumber(parsed.bestLogicScore)),
      bestImpulseAccuracy: Math.max(0, Math.min(100, safeNumber(parsed.bestImpulseAccuracy))),
      totalRuns: Math.max(0, safeNumber(parsed.totalRuns)),
      totalMemoryRuns: Math.max(0, safeNumber(parsed.totalMemoryRuns)),
      totalAttentionRuns: Math.max(0, safeNumber(parsed.totalAttentionRuns)),
      totalLogicRuns: Math.max(0, safeNumber(parsed.totalLogicRuns)),
      totalImpulseRuns: Math.max(0, safeNumber(parsed.totalImpulseRuns)),
      runHistory: parsedHistory,
      activityDates,
      currentStreak: streak.currentStreak,
      bestStreak: Math.max(safeNumber(parsed.bestStreak), streak.bestStreak),
      dailyChallengeDates,
      completedDailyChallenges: Math.max(safeNumber(parsed.completedDailyChallenges), dailyChallengeDates.length),
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
    return { ...basePlayer, unlockedAchievements: normalizeUnlocked([...basePlayer.unlockedAchievements, ...eligible]) };
  } catch {
    return defaultPlayer();
  }
}

function metricSummary(result) {
  const summary = {};
  for (const key of ['score', 'rounds', 'accuracy', 'average', 'best', 'falseAlarmRate', 'falseAlarms', 'correctNoGo', 'misses', 'hits', 'totalTrials']) {
    const value = result?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) summary[key] = value;
  }
  if (Array.isArray(result?.roundHistory)) {
    summary.roundCount = result.roundHistory.length;
    summary.mistakes = result.roundHistory.filter((item) => !item?.correct).length;
  } else if (Array.isArray(result?.times)) {
    summary.roundCount = result.times.length;
    summary.mistakes = 0;
  }
  return summary;
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
  const labelMap = { reaction: 'Reaction', memory: 'Memory', attention: 'Attention', logic: 'Logic', impulse: 'Impulse' };
  const entry = {
    id: at + '-' + result.type,
    type: result.type,
    label: labelMap[result.type] || result.type,
    metric: metricMap[result.type] || '—',
    xp: Math.max(0, Number(result.xp) || 0),
    at,
    ...metricSummary(result),
  };
  const nextHistory = [entry, ...(player.runHistory || [])].slice(0, MAX_RUN_HISTORY);
  const activityDate = dateKeyFromTimestamp(at);
  const activityDates = normalizeDateKeys([...(player.activityDates || []), activityDate].filter(Boolean));
  const streak = getStreakStats(activityDates);
  const progressPlayer = {
    ...player,
    runHistory: nextHistory,
    activityDates,
    currentStreak: streak.currentStreak,
    bestStreak: Math.max(player.bestStreak || 0, streak.bestStreak),
  };
  const eligible = getEligibleAchievementIds(progressPlayer);
  return { ...progressPlayer, unlockedAchievements: normalizeUnlocked([...(player.unlockedAchievements || []), ...eligible]) };
}

export function savePlayer(player) {
  const key = getStorageKey();
  try {
    const payload = { ...player, schemaVersion: STORAGE_SCHEMA_VERSION, savedAt: new Date().toISOString() };
    const serialized = JSON.stringify(payload);
    localStorage.setItem(key, serialized);
    const verified = localStorage.getItem(key) === serialized;
    if (verified && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('brain-player-saved', { detail: { player: payload } }));
    }
    return verified;
  } catch {
    return false;
  }
}
