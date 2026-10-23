import test from 'node:test';
import assert from 'node:assert/strict';
import { mergePlayerSnapshots } from './cloudProgress.js';
import { getCompetitiveScore } from './socialApi.js';

const base = {
  schemaVersion: 2, xp: 50, level: 1, totalRuns: 1,
  totalMemoryRuns: 1, totalAttentionRuns: 0, totalLogicRuns: 0, totalImpulseRuns: 0,
  bestReaction: 250, bestMemoryScore: 1, bestAttentionScore: 0, bestLogicScore: 0, bestImpulseAccuracy: 0,
  skillMastery: { reaction: 20, memory: 30, attention: 0, logic: 0, impulse: 0 },
  activityDates: ['2026-10-21'], dailyChallengeDates: [], unlockedAchievements: [],
  runHistory: [{ id: 'memory-1', type: 'memory', at: '2026-10-21T10:00:00.000Z', score: 1, rounds: 5, accuracy: 20, xp: 25 }],
};

test('cloud merge deduplicates runs and preserves better mastery and best results', () => {
  const local = { ...base, xp: 75, savedAt: '2026-10-22T08:00:00.000Z', skillMastery: { ...base.skillMastery, memory: 45 } };
  const cloud = {
    ...base, xp: 100, savedAt: '2026-10-23T08:00:00.000Z', bestReaction: 230,
    skillMastery: { ...base.skillMastery, memory: 40 },
    runHistory: [...base.runHistory, { id: 'reaction-2', type: 'reaction', at: '2026-10-22T10:00:00.000Z', average: 230, xp: 25 }],
    totalRuns: 2,
  };
  const merged = mergePlayerSnapshots(local, cloud);
  assert.equal(merged.runHistory.length, 2);
  assert.equal(merged.bestReaction, 230);
  assert.equal(merged.skillMastery.memory, 45);
  assert.ok(merged.xp >= 100);
  assert.equal(merged.totalRuns, 2);
});

test('reaction challenge score rewards faster average reaction time', () => {
  const fast = getCompetitiveScore({ type: 'reaction', average: 200 }, 'reaction');
  const slow = getCompetitiveScore({ type: 'reaction', average: 350 }, 'reaction');
  assert.ok(fast.score > slow.score);
  assert.equal(fast.rawMetric, '200 ms average');
});

test('challenge scores use accuracy on comparable game modes', () => {
  assert.deepEqual(getCompetitiveScore({ type: 'memory', accuracy: 80, score: 4, rounds: 5 }, 'memory'), { score: 80, rawMetric: '80% accuracy' });
});

test('a score cannot be created from a run for another skill', () => {
  assert.throws(() => getCompetitiveScore({ type: 'memory', accuracy: 80 }, 'logic'), /Finish a new logic run/);
});

test('re-merging the same cloud snapshot does not inflate XP or run counts', () => {
  const first = mergePlayerSnapshots(base, base);
  const second = mergePlayerSnapshots(first, base);
  assert.equal(first.xp, second.xp);
  assert.equal(first.runHistory.length, second.runHistory.length);
  assert.equal(first.totalRuns, second.totalRuns);
});
