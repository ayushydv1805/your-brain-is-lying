import { supabase } from '../lib/supabaseClient.js';
import { getPlayerStorageStatus, loadPlayer, savePlayer } from './storage.js';

const MAX_RUNS = 500;
const SKILLS = ['reaction', 'memory', 'attention', 'logic', 'impulse'];
const COUNTERS = {
  reaction: 'totalRuns',
  memory: 'totalMemoryRuns',
  attention: 'totalAttentionRuns',
  logic: 'totalLogicRuns',
  impulse: 'totalImpulseRuns',
};
const BEST_FIELDS = {
  memory: 'bestMemoryScore',
  attention: 'bestAttentionScore',
  logic: 'bestLogicScore',
  impulse: 'bestImpulseAccuracy',
};
const LAST_FIELDS = {
  reaction: 'lastRun',
  memory: 'lastMemoryRun',
  attention: 'lastAttentionRun',
  logic: 'lastLogicRun',
  impulse: 'lastImpulseRun',
};

function timestamp(value) {
  const result = new Date(value || 0).getTime();
  return Number.isFinite(result) ? result : 0;
}

function historyKey(run) {
  return run?.id || (run?.type || 'unknown') + ':' + (run?.at || '') + ':' + (run?.metric || '');
}

function countRuns(history, skill) {
  return history.filter((run) => run?.type === skill).length;
}

function counterBaseline(player, skill) {
  const field = COUNTERS[skill];
  return Math.max(0, Number(player?.[field] || 0) - countRuns(
    Array.isArray(player?.runHistory) ? player.runHistory : [],
    skill,
  ));
}

function runXp(player) {
  return (Array.isArray(player?.runHistory) ? player.runHistory : [])
    .reduce((sum, run) => sum + Math.max(0, Number(run?.xp) || 0), 0);
}

function maxNullable(left, right) {
  if (left == null) return right == null ? null : right;
  if (right == null) return left;
  const a = Number(left);
  const b = Number(right);
  if (!Number.isFinite(a)) return Number.isFinite(b) ? b : null;
  if (!Number.isFinite(b)) return a;
  return Math.min(a, b);
}

function newest(left, right) {
  if (!left) return right || null;
  if (!right) return left;
  return timestamp(left.at) >= timestamp(right.at) ? left : right;
}

/**
 * Merge two local/cloud snapshots without double-counting identical run IDs.
 * Saved history remains capped, matching the app's existing local history limit.
 */
export function mergePlayerSnapshots(localPlayer, cloudPlayer) {
  const local = localPlayer && typeof localPlayer === 'object' ? localPlayer : {};
  const cloud = cloudPlayer && typeof cloudPlayer === 'object' ? cloudPlayer : {};
  const localRuns = Array.isArray(local.runHistory) ? local.runHistory : [];
  const cloudRuns = Array.isArray(cloud.runHistory) ? cloud.runHistory : [];
  const mergedById = new Map();
  for (const run of [...localRuns, ...cloudRuns]) {
    if (!run || typeof run.type !== 'string' || !run.at) continue;
    const key = historyKey(run);
    const existing = mergedById.get(key);
    if (!existing || timestamp(run.at) > timestamp(existing.at)) mergedById.set(key, run);
  }
  const runHistory = [...mergedById.values()]
    .sort((a, b) => timestamp(b.at) - timestamp(a.at))
    .slice(0, MAX_RUNS);
  const unionActivity = [...new Set([
    ...(Array.isArray(local.activityDates) ? local.activityDates : []),
    ...(Array.isArray(cloud.activityDates) ? cloud.activityDates : []),
  ])].sort().reverse().slice(0, 180);
  const localDaily = Array.isArray(local.dailyChallengeDates) ? local.dailyChallengeDates : [];
  const cloudDaily = Array.isArray(cloud.dailyChallengeDates) ? cloud.dailyChallengeDates : [];
  const dailyChallengeDates = [...new Set([...localDaily, ...cloudDaily])].sort().reverse().slice(0, 180);
  const skillMastery = {};
  for (const skill of SKILLS) {
    skillMastery[skill] = Math.max(
      0,
      Math.min(100, Number(local.skillMastery?.[skill]) || 0, 100),
      Math.min(100, Number(cloud.skillMastery?.[skill]) || 0),
    );
  }
  const merged = {
    ...local,
    ...cloud,
    schemaVersion: 2,
    xp: Math.max(0, Math.max(
      0,
      (Number(local.xp) || 0) - runXp(local),
      (Number(cloud.xp) || 0) - runXp(cloud),
    ) + runHistory.reduce((sum, run) => sum + Math.max(0, Number(run.xp) || 0), 0)),
    level: Math.max(1, Number(local.level) || 1, Number(cloud.level) || 1),
    runHistory,
    activityDates: unionActivity,
    dailyChallengeDates,
    completedDailyChallenges: Math.max(
      Number(local.completedDailyChallenges) || 0,
      Number(cloud.completedDailyChallenges) || 0,
      dailyChallengeDates.length,
    ),
    currentStreak: Math.max(Number(local.currentStreak) || 0, Number(cloud.currentStreak) || 0),
    bestStreak: Math.max(Number(local.bestStreak) || 0, Number(cloud.bestStreak) || 0),
    unlockedAchievements: [...new Set([
      ...(Array.isArray(local.unlockedAchievements) ? local.unlockedAchievements : []),
      ...(Array.isArray(cloud.unlockedAchievements) ? cloud.unlockedAchievements : []),
    ])],
    skillMastery,
  };
  merged.bestReaction = maxNullable(local.bestReaction, cloud.bestReaction);
  for (const [skill, field] of Object.entries(BEST_FIELDS)) {
    merged[field] = Math.max(Number(local[field]) || 0, Number(cloud[field]) || 0);
  }
  for (const skill of SKILLS) {
    const counter = COUNTERS[skill];
    const baseCount = Math.max(counterBaseline(local, skill), counterBaseline(cloud, skill));
    merged[counter] = baseCount + countRuns(runHistory, skill);
    merged[LAST_FIELDS[skill]] = newest(local[LAST_FIELDS[skill]], cloud[LAST_FIELDS[skill]]);
  }
  merged.savedAt = new Date(Math.max(timestamp(local.savedAt), timestamp(cloud.savedAt), Date.now())).toISOString();
  return merged;
}

export async function pullCloudProgress(userId) {
  if (!supabase || !userId) throw new Error('Cloud authentication is not configured.');
  const { data, error } = await supabase
    .from('brain_progress')
    .select('player_data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function pushCloudProgress(userId, player) {
  if (!supabase || !userId) throw new Error('Cloud authentication is not configured.');
  const payload = {
    user_id: userId,
    schema_version: 2,
    player_data: player,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('brain_progress')
    .upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function hydrateCloudProgress(userId) {
  if (!supabase || !userId) throw new Error('Cloud authentication is not configured.');
  window.localStorage.setItem('your-brain-is-lying-active-profile', userId);
  const storageStatus = getPlayerStorageStatus();
  const localPlayer = loadPlayer();
  const cloudRow = await pullCloudProgress(userId);
  let nextPlayer;

  if (cloudRow?.player_data && storageStatus.hasSavedData) {
    nextPlayer = mergePlayerSnapshots(localPlayer, cloudRow.player_data);
  } else if (cloudRow?.player_data) {
    nextPlayer = cloudRow.player_data;
  } else if (storageStatus.hasSavedData) {
    nextPlayer = localPlayer;
  } else {
    return { player: localPlayer, hadCloudSave: false, uploaded: false };
  }

  if (!savePlayer(nextPlayer)) throw new Error('Could not save the synced progress to this device. Check storage permissions.');
  await pushCloudProgress(userId, loadPlayer());
  return { player: loadPlayer(), hadCloudSave: Boolean(cloudRow), uploaded: !cloudRow };
}

export async function refreshCloudProgress(userId) {
  if (!supabase || !userId) return null;
  const cloudRow = await pullCloudProgress(userId);
  if (!cloudRow?.player_data) return null;
  const localStatus = getPlayerStorageStatus();
  const localPlayer = loadPlayer();
  const next = localStatus.hasSavedData
    ? mergePlayerSnapshots(localPlayer, cloudRow.player_data)
    : cloudRow.player_data;
  if (!savePlayer(next)) throw new Error('Could not persist synced progress locally.');
  return loadPlayer();
}
