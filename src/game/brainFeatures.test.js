import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMistakeReview, getCoachInsights, getSkillStats, getTrainingPlan, getWeeklySummary, validatePlayerRecord } from './brainFeatures.js';

const emptyPlayer = {
  xp: 0, level: 1, skillMastery: {}, runHistory: [], activityDates: [],
  totalRuns: 0, totalMemoryRuns: 0, totalAttentionRuns: 0, totalLogicRuns: 0, totalImpulseRuns: 0,
};

test('training plan supports 5, 10 and 15 minute sessions', () => {
  for (const minutes of [5, 10, 15]) {
    const plan = getTrainingPlan(emptyPlayer, minutes);
    assert.equal(plan.minutes, minutes);
    assert.equal(plan.steps.reduce((sum, step) => sum + step.duration, 0), minutes);
    assert.ok(plan.steps.every((step) => step.action && step.label));
  }
});

test('training plan falls back safely for invalid duration', () => {
  assert.equal(getTrainingPlan(emptyPlayer, 99).minutes, 10);
});

test('coach gives a baseline recommendation to a new player', () => {
  const insights = getCoachInsights(emptyPlayer);
  assert.ok(insights.length >= 3);
  assert.match(insights[0].title, /baseline/i);
});

test('skill stats clamps mastery and counts actual history runs', () => {
  const player = { ...emptyPlayer, skillMastery: { memory: 130 }, runHistory: [{ type: 'memory', accuracy: 80, at: '2026-10-22T10:00:00Z' }] };
  const stats = getSkillStats(player);
  const memory = stats.find((item) => item.key === 'memory');
  assert.equal(memory.mastery, 100);
  assert.equal(memory.runs, 1);
  assert.equal(memory.averageAccuracy, 80);
});

test('weekly summary compares the last 7 days with the previous 7 days', () => {
  const now = new Date('2026-10-23T12:00:00Z');
  const player = {
    ...emptyPlayer,
    runHistory: [
      { type: 'memory', at: '2026-10-22T12:00:00Z', xp: 20, accuracy: 80 },
      { type: 'reaction', at: '2026-10-15T12:00:00Z', xp: 10, accuracy: 60 },
    ],
  };
  const summary = getWeeklySummary(player, now);
  assert.equal(summary.totalRuns, 1);
  assert.equal(summary.previousRuns, 1);
  assert.equal(summary.xpEarned, 20);
  assert.equal(summary.accuracyChange, 20);
});

test('mistake review identifies missed logic rounds and preserves explanations', () => {
  const review = buildMistakeReview({ type: 'logic', roundHistory: [
    { round: 1, correct: false, question: '2, 4, 6, ?', selected: '7', answer: '8', explanation: 'Add two each time.' },
    { round: 2, correct: true, question: 'A', selected: 'A', answer: 'A', explanation: 'Match.' },
  ] });
  assert.equal(review.length, 2);
  assert.equal(review[0].correct, false);
  assert.match(review[0].takeaway, /Add two/);
});

test('mistake review does not fail when a reaction summary has no timings', () => {
  assert.deepEqual(buildMistakeReview({ type: 'reaction', times: [] }), []);
});

test('impulse review reports rounds with false alarms or missed go signals', () => {
  const review = buildMistakeReview({ type: 'impulse', roundHistory: [
    { round: 1, accuracy: 80, hits: 3, correctNoGo: 1, misses: 1, falseAlarms: 0 },
    { round: 2, accuracy: 100, hits: 2, correctNoGo: 3, misses: 0, falseAlarms: 0 },
  ] });
  assert.equal(review[0].correct, false);
  assert.match(review[0].detail, /misses: 1/);
  assert.equal(review[1].correct, true);
});

test('player validation rejects malformed imports', () => {
  assert.equal(validatePlayerRecord({ xp: 1, runHistory: [], activityDates: [] }), true);
  assert.equal(validatePlayerRecord({ xp: -1, runHistory: [], activityDates: [] }), false);
  assert.equal(validatePlayerRecord({ xp: 1, runHistory: 'bad', activityDates: [] }), false);
});
