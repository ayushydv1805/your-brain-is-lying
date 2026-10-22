export const SKILLS = [
  { key: 'reaction', label: 'Reaction', icon: '⚡', action: 'reaction', description: 'Practice responding quickly without rushing.' },
  { key: 'memory', label: 'Memory', icon: '🧠', action: 'memory', description: 'Practice accurate recall of changing sequences.' },
  { key: 'attention', label: 'Attention', icon: '👁️', action: 'attention', description: 'Practice finding the exact target among distractors.' },
  { key: 'logic', label: 'Logic', icon: '🧩', action: 'logic', description: 'Practice patterns, reasoning and deductions.' },
  { key: 'impulse', label: 'Impulse', icon: '🎯', action: 'impulse', description: 'Practice acting on go signals and holding on no-go signals.' },
];

const COUNT_FIELDS = {
  reaction: 'totalRuns',
  memory: 'totalMemoryRuns',
  attention: 'totalAttentionRuns',
  logic: 'totalLogicRuns',
  impulse: 'totalImpulseRuns',
};

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function countForSkill(player, skill) {
  const value = Number(player?.[COUNT_FIELDS[skill]]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function getSkillStats(player, runs = player?.runHistory || []) {
  return SKILLS.map((skill) => {
    const relevantRuns = runs.filter((run) => run?.type === skill.key);
    const mastery = Math.max(0, Math.min(100, Number(player?.skillMastery?.[skill.key]) || 0));
    const accuracies = relevantRuns.map((run) => Number(run.accuracy)).filter(Number.isFinite);
    const means = relevantRuns.map((run) => Number(run.average)).filter((value) => Number.isFinite(value) && value > 0);
    const scores = relevantRuns.map((run) => Number(run.score)).filter(Number.isFinite);
    return {
      ...skill,
      mastery,
      runs: Math.max(relevantRuns.length, countForSkill(player, skill.key)),
      recentRuns: relevantRuns.length,
      averageAccuracy: accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : null,
      averageMetric: means.length ? Math.round(means.reduce((a, b) => a + b, 0) / means.length) : null,
      latestScore: scores.length ? scores[0] : null,
    };
  });
}

export function getTrainingPlan(player, minutes = 10) {
  const allowedMinutes = [5, 10, 15].includes(Number(minutes)) ? Number(minutes) : 10;
  const stats = getSkillStats(player);
  const runs = Array.isArray(player?.runHistory) ? player.runHistory : [];
  const played = new Set(runs.slice(0, 10).map((run) => run.type));
  const ordered = [...stats].sort((a, b) => {
    const scoreA = a.mastery - (played.has(a.key) ? 0 : 8);
    const scoreB = b.mastery - (played.has(b.key) ? 0 : 8);
    return scoreA - scoreB || a.runs - b.runs;
  });
  const templates = allowedMinutes === 5
    ? [2, 3]
    : allowedMinutes === 10
      ? [3, 4, 3]
      : [4, 4, 4, 3];
  return {
    minutes: allowedMinutes,
    title: allowedMinutes === 5 ? 'Quick reset' : allowedMinutes === 10 ? 'Balanced session' : 'Deep practice',
    description: allowedMinutes === 5
      ? 'A low-friction session for busy days.'
      : allowedMinutes === 10
        ? 'A balanced mix of practice, with extra time for a priority skill.'
        : 'A longer session with varied tasks and time to review mistakes.',
    steps: templates.map((duration, index) => {
      const skill = ordered[index % ordered.length];
      const rationale = skill.runs === 0
        ? 'Build a first baseline'
        : skill.mastery < 35
          ? 'Give this lower-mastery skill extra practice'
          : skill.mastery < 65
            ? 'Build consistency'
            : 'Keep this skill fresh';
      return { ...skill, duration, rationale };
    }),
  };
}

export function getCoachInsights(player) {
  const runs = Array.isArray(player?.runHistory) ? player.runHistory : [];
  const stats = getSkillStats(player);
  if (!runs.length) {
    return [
      { title: 'Start with a baseline', body: 'Try one short test in any skill. Your first completed run gives the coach real results to work from.', action: 'reaction', button: 'Start a reaction test', icon: '⚡' },
      { title: 'Train a little at a time', body: 'A 5-minute routine is a useful starting point. You can adjust the plan after you have a few results.', action: 'plan', button: 'Build a training plan', icon: '🗓️' },
      { title: 'Keep it about practice', body: 'These mini-games track your performance inside this app; they are not a diagnosis or a formal measure of intelligence.', action: 'weekly', button: 'See weekly report', icon: '📊' },
    ];
  }

  const playedStats = stats.filter((stat) => stat.runs > 0);
  const lowest = [...playedStats].sort((a, b) => a.mastery - b.mastery)[0] || stats[0];
  const recent = runs.slice(0, 7);
  const earlier = runs.slice(7, 14);
  const recentAccuracy = recent.map((run) => Number(run.accuracy)).filter(Number.isFinite);
  const earlierAccuracy = earlier.map((run) => Number(run.accuracy)).filter(Number.isFinite);
  const avg = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const cards = [{
    title: 'Your next practice target',
    body: lowest.mastery < 35
      ? lowest.label + ' is currently your lowest recorded mastery (' + lowest.mastery + '%). Try a calm practice run and review any missed rounds.'
      : lowest.label + ' has the lowest of your recorded mastery scores (' + lowest.mastery + '%). Keep it in the rotation and track how it changes over time.',
    action: lowest.action,
    button: 'Practice ' + lowest.label.toLowerCase(),
    icon: lowest.icon,
  }];
  const a = avg(recentAccuracy);
  const b = avg(earlierAccuracy);
  if (a !== null && b !== null) {
    const change = Math.round(a - b);
    cards.push({
      title: change > 0 ? 'Recent accuracy is trending up' : change < 0 ? 'A useful review opportunity' : 'Accuracy is holding steady',
      body: 'Your last ' + recent.length + ' saved runs average ' + Math.round(a) + '% accuracy' + (change === 0 ? ', matching the previous comparison window.' : ', ' + Math.abs(change) + ' percentage points ' + (change > 0 ? 'above' : 'below') + ' the preceding runs. Treat this as a small sample, not a verdict.'),
      action: 'weekly',
      button: 'Review weekly progress',
      icon: '📈',
    });
  } else {
    cards.push({
      title: 'Build a clearer pattern',
      body: 'Complete a few more sessions across different skills. The coach can compare accuracy trends when both recent and earlier runs contain measurable accuracy.',
      action: 'plan',
      button: 'Use a balanced plan',
      icon: '🧭',
    });
  }
  cards.push({
    title: 'Make practice repeatable',
    body: 'Use a ' + (runs.length < 5 ? '5-minute' : '10-minute') + ' plan, and change only one thing at a time. Look for patterns across several sessions rather than one result.',
    action: 'plan',
    button: 'Create my plan',
    icon: '🗓️',
  });
  return cards;
}

export function getWeeklySummary(player, referenceDate = new Date()) {
  const now = validDate(referenceDate) || new Date();
  const today = startOfDay(now);
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - 6);
  const previousStart = new Date(today);
  previousStart.setDate(previousStart.getDate() - 13);
  const currentEnd = new Date(today);
  currentEnd.setDate(currentEnd.getDate() + 1);

  const history = Array.isArray(player?.runHistory) ? player.runHistory : [];
  const current = history.filter((run) => {
    const date = validDate(run.at);
    return date && date >= currentStart && date < currentEnd;
  });
  const previous = history.filter((run) => {
    const date = validDate(run.at);
    return date && date >= previousStart && date < currentStart;
  });
  const sumXp = (runs) => runs.reduce((sum, run) => sum + Math.max(0, Number(run.xp) || 0), 0);
  const accuracyValues = (runs) => runs.map((run) => Number(run.accuracy)).filter(Number.isFinite);
  const average = (values) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  const currentAccuracy = average(accuracyValues(current));
  const previousAccuracy = average(accuracyValues(previous));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentStart);
    date.setDate(currentStart.getDate() + index);
    const key = dayKey(date);
    const dayRuns = current.filter((run) => {
      const runDate = validDate(run.at);
      return runDate && dayKey(runDate) === key;
    });
    return { key, label: date.toLocaleDateString(undefined, { weekday: 'short' }), dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), runs: dayRuns.length, xp: sumXp(dayRuns) };
  });
  const bySkill = SKILLS.map((skill) => {
    const skillRuns = current.filter((run) => run.type === skill.key);
    return { ...skill, runs: skillRuns.length, xp: sumXp(skillRuns) };
  });
  const best = [...bySkill].sort((a, b) => b.runs - a.runs)[0];
  const activeDays = days.filter((day) => day.runs > 0).length;
  return {
    generatedAt: now.toISOString(),
    rangeStart: currentStart.toISOString(),
    rangeEnd: today.toISOString(),
    current,
    previous,
    days,
    bySkill,
    totalRuns: current.length,
    previousRuns: previous.length,
    xpEarned: sumXp(current),
    previousXp: sumXp(previous),
    activeDays,
    averageAccuracy: currentAccuracy,
    previousAverageAccuracy: previousAccuracy,
    accuracyChange: currentAccuracy !== null && previousAccuracy !== null ? currentAccuracy - previousAccuracy : null,
    runChange: current.length - previous.length,
    bestFocus: best?.runs ? best.label : 'Not enough data yet',
    currentStreak: Number(player?.currentStreak) || 0,
    bestStreak: Number(player?.bestStreak) || 0,
    xpTotal: Number(player?.xp) || 0,
    level: Number(player?.level) || 1,
  };
}

export function buildMistakeReview(result, skill = result?.type) {
  if (skill === 'reaction') {
    const times = (Array.isArray(result?.times) ? result.times : []).map(Number).filter((time) => Number.isFinite(time) && time > 0);
    if (!times.length) return [];
    const best = Math.min(...times);
    const spread = Math.max(...times) - best;
    const avg = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
    return [{
      round: 'Summary',
      correct: true,
      title: spread > 120 ? 'Reaction time varied across rounds' : 'Reaction times recorded',
      detail: 'Average ' + avg + ' ms · best ' + best + ' ms · range ' + spread + ' ms.',
      takeaway: spread > 120
        ? 'Try staying relaxed and waiting for the actual signal. Compare several runs before drawing conclusions.'
        : 'Repeat the test under similar conditions and focus on consistency, not only your single fastest response.',
    }];
  }
  const history = Array.isArray(result?.roundHistory) ? result.roundHistory : [];
  return history.map((item) => {
    const correct = skill === 'impulse'
      ? Number(item?.accuracy) >= 100
      : Boolean(item?.correct);
    let title = correct ? 'Correct round' : 'Round to review';
    let detail = '';
    let takeaway = '';
    if (skill === 'memory') {
      detail = 'Sequence: ' + (Array.isArray(item.sequence) ? item.sequence.join(' ') : 'not recorded') + '. Your recall: ' + (Array.isArray(item.recalled) && item.recalled.length ? item.recalled.join(' ') : 'no selection') + '.';
      takeaway = correct ? 'Keep using a steady scan order for the sequence.' : 'Group symbols into small chunks, then replay them in the same order. The sequence is shown for review only.';
    } else if (skill === 'attention') {
      detail = 'Target: ' + (item.target ?? 'not recorded') + '. Selected: ' + (item.selected ?? (item.timedOut ? 'timed out' : 'no selection')) + '.';
      takeaway = correct ? 'Verify both parts of the target before clicking.' : 'Pause to compare the complete target, not just the first matching character.';
      title = correct ? 'Target found' : item.timedOut ? 'Time expired' : 'Target mismatch';
    } else if (skill === 'logic') {
      detail = (item.question || 'Problem') + ' Your answer: ' + (item.selected ?? 'no answer') + '. Correct answer: ' + (item.answer ?? 'not recorded') + '.';
      takeaway = item.explanation || (correct ? 'Check the rule once more before selecting.' : 'Describe the rule in your own words, then test it against each option.');
      title = correct ? 'Reasoning matched' : 'Problem to review';
    } else if (skill === 'impulse') {
      detail = 'Hits: ' + (item.hits ?? 0) + ', correct holds: ' + (item.correctNoGo ?? 0) + ', misses: ' + (item.misses ?? 0) + ', false alarms: ' + (item.falseAlarms ?? 0) + '.';
      takeaway = correct ? 'Keep matching the response to the signal rule.' : 'Before responding, identify whether the signal calls for action or restraint.';
      title = correct ? 'Rule followed' : 'Response to review';
    } else {
      detail = item.detail || 'Round details were not recorded.';
      takeaway = correct ? 'Keep practicing consistently.' : 'Review the instruction, then try a slower deliberate attempt.';
    }
    return { round: item.round ?? '?', correct, title, detail, takeaway };
  });
}

export function validatePlayerRecord(player) {
  if (!player || typeof player !== 'object' || Array.isArray(player)) return false;
  if (!Number.isFinite(Number(player.xp)) || Number(player.xp) < 0) return false;
  if (!Array.isArray(player.runHistory) || !Array.isArray(player.activityDates)) return false;
  return player.runHistory.every((run) => run && typeof run.type === 'string' && validDate(run.at));
}
