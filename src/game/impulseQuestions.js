const SYMBOL_PAIRS = [
  { target: '◯', distractor: '●', targetLabel: 'HOLLOW CIRCLE' },
  { target: '◇', distractor: '◆', targetLabel: 'HOLLOW DIAMOND' },
  { target: '△', distractor: '▲', targetLabel: 'HOLLOW TRIANGLE' },
];

function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getImpulseTrialCount(level, round = 1) {
  const safeLevel = clamp(Number(level) || 1, 1, 10);
  const safeRound = clamp(Number(round) || 1, 1, 5);
  return Math.min(
    14,
    9 +
      Math.floor((safeLevel - 1) / 2) +
      Math.floor((safeRound - 1) / 2),
  );
}

export function getImpulseInterval(level, round = 1) {
  const safeLevel = clamp(Number(level) || 1, 1, 10);
  const safeRound = clamp(Number(round) || 1, 1, 5);
  const levelPressure = (safeLevel - 1) * 48;
  const roundPressure = (safeRound - 1) * 28;
  return Math.max(620, 1180 - levelPressure - roundPressure);
}

export function createImpulseRound(level, round = 1) {
  const pair = SYMBOL_PAIRS[Math.floor(Math.random() * SYMBOL_PAIRS.length)];
  const trialCount = getImpulseTrialCount(level, round);
  const interval = getImpulseInterval(level, round);
  const trials = [];

  for (let index = 0; index < trialCount; index += 1) {
    const match = index === 0 ? true : Math.random() < 0.58;
    trials.push({
      id:
        String(round) +
        '-' +
        String(index) +
        '-' +
        Math.random().toString(36).slice(2, 7),
      symbol: match ? pair.target : pair.distractor,
      match,
      duration: Math.round(interval * (0.92 + Math.random() * 0.16)),
    });
  }

  if (!trials.some((trial) => !trial.match) && trials.length > 1) {
    trials[trials.length - 1] = {
      ...trials[trials.length - 1],
      symbol: pair.distractor,
      match: false,
    };
  }

  return {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    target: pair.target,
    targetLabel: pair.targetLabel,
    distractor: pair.distractor,
    trials: shuffled(trials),
    trialCount,
    interval,
  };
}
