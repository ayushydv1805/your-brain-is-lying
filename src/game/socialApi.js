import { supabase } from '../lib/supabaseClient.js';

function requireClient() {
  if (!supabase) throw new Error('Cloud/social features are not configured for this installation.');
  return supabase;
}

export async function getMyProfile(userId) {
  const client = requireClient();
  const { data, error } = await client.from('brain_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveMyProfile(userId, { handle, displayName }) {
  const client = requireClient();
  const safeHandle = String(handle || '').trim().toLowerCase();
  const safeName = String(displayName || '').trim().replace(/\s+/g, ' ');
  if (!/^[a-z0-9_]{3,20}$/.test(safeHandle)) throw new Error('Handle must be 3–20 characters using lowercase letters, numbers or underscores.');
  if (safeName.length < 2 || safeName.length > 40) throw new Error('Display name must be 2–40 characters.');
  const { data, error } = await client.from('brain_profiles')
    .upsert({ user_id: userId, handle: safeHandle, display_name: safeName }, { onConflict: 'user_id' })
    .select('*').single();
  if (error) {
    if (error.code === '23505') throw new Error('That handle is already in use. Please choose another.');
    throw error;
  }
  return data;
}

export async function updateProfile(userId, patch) {
  const client = requireClient();
  const safePatch = {};
  if (typeof patch.leaderboard_opt_in === 'boolean') safePatch.leaderboard_opt_in = patch.leaderboard_opt_in;
  if (typeof patch.avatar_emoji === 'string' && patch.avatar_emoji.length <= 8) safePatch.avatar_emoji = patch.avatar_emoji;
  if (typeof patch.display_name === 'string') {
    const displayName = patch.display_name.trim().replace(/\s+/g, ' ');
    if (displayName.length < 2 || displayName.length > 40) throw new Error('Display name must be 2–40 characters.');
    safePatch.display_name = displayName;
  }
  if (!Object.keys(safePatch).length) throw new Error('Choose a profile setting to update.');
  const { data, error } = await client.from('brain_profiles').update(safePatch).eq('user_id', userId).select('*').single();
  if (error) throw error;
  return data;
}

export async function findProfileByHandle(handle) {
  const client = requireClient();
  const needle = String(handle || '').trim().toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9_]{3,20}$/.test(needle)) throw new Error('Enter a valid handle: 3–20 lowercase letters, numbers or underscores.');
  const { data, error } = await client.from('brain_profiles')
    .select('user_id,handle,display_name,avatar_emoji,leaderboard_opt_in')
    .eq('handle', needle).limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

export async function sendFriendRequest(requesterId, receiverId) {
  const client = requireClient();
  if (!requesterId || !receiverId || requesterId === receiverId) throw new Error('Choose another player.');
  const { data, error } = await client.from('brain_friend_requests')
    .insert({ requester_id: requesterId, receiver_id: receiverId })
    .select('*').single();
  if (error) {
    if (error.code === '23505') throw new Error('A request or friendship already exists for these accounts.');
    throw error;
  }
  return data;
}

export async function loadFriendRequests(userId) {
  const client = requireClient();
  const { data, error } = await client.from('brain_friend_requests')
    .select('*')
    .or('requester_id.eq.' + userId + ',receiver_id.eq.' + userId)
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data || [];
}

export async function respondToFriendRequest(requestId, userId, status) {
  if (!['accepted', 'declined'].includes(status)) throw new Error('Invalid friend request action.');
  const client = requireClient();
  const { data, error } = await client.from('brain_friend_requests')
    .update({ status })
    .eq('id', requestId).eq('receiver_id', userId).eq('status', 'pending')
    .select('*').single();
  if (error) throw error;
  return data;
}

export async function cancelFriendRequest(requestId, userId) {
  const client = requireClient();
  const { error } = await client.from('brain_friend_requests')
    .delete().eq('id', requestId).eq('requester_id', userId).eq('status', 'pending');
  if (error) throw error;
}

export async function loadChallenges(userId) {
  const client = requireClient();
  const { data, error } = await client.from('brain_challenges')
    .select('*')
    .or('challenger_id.eq.' + userId + ',opponent_id.eq.' + userId)
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data || [];
}

export async function createChallenge(challengerId, opponentId, skill) {
  if (!['reaction', 'memory', 'attention', 'logic', 'impulse'].includes(skill)) throw new Error('Choose a supported skill.');
  const client = requireClient();
  const { data, error } = await client.from('brain_challenges')
    .insert({ challenger_id: challengerId, opponent_id: opponentId, skill })
    .select('*').single();
  if (error) throw error;
  return data;
}

export async function updateChallengeStatus(challengeId, status) {
  if (!['accepted', 'declined', 'cancelled'].includes(status)) throw new Error('Invalid challenge action.');
  const client = requireClient();
  const { data, error } = await client.from('brain_challenges')
    .update({ status }).eq('id', challengeId).eq('status', 'pending')
    .select('*').single();
  if (error) throw error;
  return data;
}

export async function loadChallengeScores(challengeIds) {
  if (!challengeIds.length) return [];
  const client = requireClient();
  const { data, error } = await client.from('brain_challenge_scores')
    .select('*').in('challenge_id', challengeIds).order('submitted_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export function getCompetitiveScore(run, skill) {
  if (!run || run.type !== skill) throw new Error('Finish a new ' + skill + ' run after this challenge is accepted.');
  if (skill === 'reaction') {
    const average = Number(run.average);
    if (!Number.isFinite(average) || average <= 0) throw new Error('This reaction run has no valid timing result.');
    return { score: Math.max(0, Math.min(100, Math.round(100 - Math.max(0, average - 150) / 6))), rawMetric: Math.round(average) + ' ms average' };
  }
  const accuracy = Number(run.accuracy);
  const rawScore = Number(run.score);
  const rounds = Number(run.rounds);
  let score = Number.isFinite(accuracy) ? accuracy
    : Number.isFinite(rawScore) && rounds > 0 ? rawScore / rounds * 100
      : NaN;
  if (!Number.isFinite(score)) throw new Error('The saved run does not contain a comparable score.');
  return {
    score: Math.max(0, Math.min(100, Number(score.toFixed(2)))),
    rawMetric: Number.isFinite(accuracy) ? Math.round(accuracy) + '% accuracy' : rawScore + '/' + rounds,
  };
}

export async function submitChallengeScore(challengeId, userId, run, skill) {
  const normalized = getCompetitiveScore(run, skill);
  const client = requireClient();
  const { data, error } = await client.from('brain_challenge_scores')
    .insert({ challenge_id: challengeId, user_id: userId, score: normalized.score, raw_metric: normalized.rawMetric })
    .select('*').single();
  if (error) {
    if (error.code === '23505') throw new Error('You have already submitted a result for this challenge.');
    throw error;
  }
  return data;
}

export async function loadLeaderboard(skill, period = 'all-time') {
  if (!['reaction', 'memory', 'attention', 'logic', 'impulse'].includes(skill)) throw new Error('Choose a valid leaderboard.');
  const client = requireClient();
  let query = client.from('brain_leaderboard_entries')
    .select('id,user_id,skill,score,raw_metric,created_at')
    .eq('skill', skill);
  if (period === 'weekly') {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    query = query.gte('created_at', start.toISOString());
  }
  const { data, error } = await query.order('score', { ascending: false }).order('created_at', { ascending: true }).limit(250);
  if (error) throw error;
  const bestByUser = new Map();
  for (const item of data || []) {
    const existing = bestByUser.get(item.user_id);
    if (!existing || Number(item.score) > Number(existing.score)) bestByUser.set(item.user_id, item);
  }
  const entries = [...bestByUser.values()].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 50);
  const userIds = entries.map((entry) => entry.user_id);
  if (!userIds.length) return [];
  const { data: profiles, error: profileError } = await client.from('brain_profiles')
    .select('user_id,handle,display_name,avatar_emoji')
    .in('user_id', userIds);
  if (profileError) throw profileError;
  const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
  return entries.map((entry) => ({ ...entry, profile: profileMap.get(entry.user_id) })).filter((entry) => entry.profile);
}

export async function publishLeaderboardResult(userId, profile, run, skill) {
  if (!profile?.leaderboard_opt_in) throw new Error('Opt in to the leaderboard before publishing scores.');
  const normalized = getCompetitiveScore(run, skill);
  const client = requireClient();
  const { data, error } = await client.from('brain_leaderboard_entries')
    .insert({ user_id: userId, skill, score: normalized.score, raw_metric: normalized.rawMetric })
    .select('*').single();
  if (error) throw error;
  return data;
}


export async function loadPublicProfiles(userIds) {
  const ids = [...new Set((userIds || []).filter((id) => typeof id === 'string' && id))];
  if (!ids.length) return [];
  const client = requireClient();
  const { data, error } = await client.from('brain_profiles')
    .select('user_id,handle,display_name,avatar_emoji,leaderboard_opt_in')
    .in('user_id', ids);
  if (error) throw error;
  return data || [];
}
