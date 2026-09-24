export const GAME_CONFIG = {
  totalReactionRounds: 5,
  totalMemoryRounds: 5,
  totalAttentionRounds: 5,
  totalLogicRounds: 5,
  totalImpulseRounds: 5,
  baseXp: 40,
  maxLevel: 10,
  xpPerLevel: 100,
  reaction: {
    minDelay: 850,
    maxDelay: 1800,
    earlyPenalty: 25,
    excellent: 250,
    good: 350,
    okay: 500,
  },
  memory: {
    excellent: 100,
    good: 80,
    okay: 60,
  },
  logic: {
    timeLimit: 60000,
    excellentAccuracy: 100,
    goodAccuracy: 80,
    okayAccuracy: 60,
    excellentAverage: 3200,
    goodAverage: 5000,
    okayAverage: 7000,
  },
  attention: {
    excellentAccuracy: 100,
    goodAccuracy: 80,
    okayAccuracy: 60,
    excellentAverage: 1800,
    goodAverage: 2600,
    okayAverage: 3600,
  },
  impulse: {
    excellentAccuracy: 95,
    goodAccuracy: 80,
    okayAccuracy: 65,
    excellentFalseAlarmRate: 5,
    goodFalseAlarmRate: 12,
    excellentAverage: 520,
    goodAverage: 800,
  },
};

export function getLevelFromXp(xp) {
  return Math.min(
    GAME_CONFIG.maxLevel,
    Math.floor(Math.max(0, xp) / GAME_CONFIG.xpPerLevel) + 1,
  );
}

export function getLevelProgress(xp) {
  const level = getLevelFromXp(xp);
  if (level >= GAME_CONFIG.maxLevel) return 100;
  return ((xp % GAME_CONFIG.xpPerLevel) / GAME_CONFIG.xpPerLevel) * 100;
}

export function getReactionDifficulty(level) {
  const safeLevel = Math.max(1, Math.min(level, GAME_CONFIG.maxLevel));
  const shrink = (safeLevel - 1) * 0.08;

  return {
    minDelay: Math.max(
      500,
      Math.round(GAME_CONFIG.reaction.minDelay * (1 - shrink)),
    ),
    maxDelay: Math.max(
      900,
      Math.round(GAME_CONFIG.reaction.maxDelay * (1 - shrink)),
    ),
  };
}

export function getReactionRating(ms) {
  if (ms <= GAME_CONFIG.reaction.excellent) {
    return { label: 'Exceptional', tone: 'excellent' };
  }

  if (ms <= GAME_CONFIG.reaction.good) {
    return { label: 'Sharp', tone: 'good' };
  }

  if (ms <= GAME_CONFIG.reaction.okay) {
    return { label: 'Solid', tone: 'okay' };
  }

  return { label: 'Warm up', tone: 'slow' };
}

export function getReactionXp(averageMs, validRounds) {
  const speedBonus = Math.max(0, Math.round((650 - averageMs) / 8));

  return Math.max(
    10,
    GAME_CONFIG.baseXp +
      speedBonus +
      Math.max(0, validRounds - 3) * 5,
  );
}

export function getMemoryRating(accuracy, completedRounds) {
  if (
    accuracy >= GAME_CONFIG.memory.excellent &&
    completedRounds === GAME_CONFIG.totalMemoryRounds
  ) {
    return { label: 'Perfect recall', tone: 'excellent' };
  }

  if (accuracy >= GAME_CONFIG.memory.good) {
    return { label: 'Sharp memory', tone: 'good' };
  }

  if (accuracy >= GAME_CONFIG.memory.okay) {
    return { label: 'Getting warmer', tone: 'okay' };
  }

  return { label: 'Train the recall', tone: 'slow' };
}

export function getMemoryXp(score, level) {
  const safeScore = Math.max(
    0,
    Math.min(GAME_CONFIG.totalMemoryRounds, Number(score) || 0),
  );
  const safeLevel = Math.max(
    1,
    Math.min(GAME_CONFIG.maxLevel, Number(level) || 1),
  );
  const levelBonus = Math.max(0, safeLevel - 1) * 3;

  return Math.max(15, 30 + safeScore * 10 + levelBonus);
}

export function getAttentionRating(accuracy, averageMs) {
  if (
    accuracy >= GAME_CONFIG.attention.excellentAccuracy &&
    averageMs !== null &&
    averageMs <= GAME_CONFIG.attention.excellentAverage
  ) {
    return { label: 'Laser focus', tone: 'excellent' };
  }

  if (
    accuracy >= GAME_CONFIG.attention.goodAccuracy &&
    averageMs !== null &&
    averageMs <= GAME_CONFIG.attention.goodAverage
  ) {
    return { label: 'Locked in', tone: 'good' };
  }

  if (accuracy >= GAME_CONFIG.attention.okayAccuracy) {
    return { label: 'Decent focus', tone: 'okay' };
  }

  return { label: 'Refocus', tone: 'slow' };
}

export function getAttentionXp(score, averageMs, level) {
  const safeScore = Math.max(
    0,
    Math.min(GAME_CONFIG.totalAttentionRounds, Number(score) || 0),
  );
  const safeAverage =
    Number.isFinite(averageMs) && averageMs > 0 ? averageMs : 5000;
  const safeLevel = Math.max(
    1,
    Math.min(GAME_CONFIG.maxLevel, Number(level) || 1),
  );

  const speedBonus = Math.max(0, Math.round((4200 - safeAverage) / 120));
  const levelBonus = Math.max(0, safeLevel - 1) * 3;

  return Math.max(
    15,
    25 + safeScore * 14 + speedBonus + levelBonus,
  );
}

export function getLogicDifficulty() {
  return { timeLimit: GAME_CONFIG.logic.timeLimit };
}

export function getLogicRating(accuracy, averageMs) {
  if (accuracy >= GAME_CONFIG.logic.excellentAccuracy && averageMs !== null && averageMs <= GAME_CONFIG.logic.excellentAverage) return { label: 'Clear reasoning', tone: 'excellent' };
  if (accuracy >= GAME_CONFIG.logic.goodAccuracy && averageMs !== null && averageMs <= GAME_CONFIG.logic.goodAverage) return { label: 'Strong logic', tone: 'good' };
  if (accuracy >= GAME_CONFIG.logic.okayAccuracy) return { label: 'Decent reasoning', tone: 'okay' };
  return { label: 'Slow the impulse', tone: 'slow' };
}

export function getLogicXp(score, averageMs, level) {
  const safeScore = Math.max(0, Math.min(GAME_CONFIG.totalLogicRounds, Number(score) || 0));
  const safeAverage = Number.isFinite(averageMs) && averageMs > 0 ? averageMs : 8200;
  const safeLevel = Math.max(1, Math.min(GAME_CONFIG.maxLevel, Number(level) || 1));
  const speedBonus = Math.max(0, Math.round((8200 - safeAverage) / 180));
  const levelBonus = Math.max(0, safeLevel - 1) * 4;
  return Math.max(15, 28 + safeScore * 15 + speedBonus + levelBonus);
}

export function getImpulseDifficulty(level, round = 1) {
  const safeLevel = Math.max(1, Math.min(level, GAME_CONFIG.maxLevel));
  const safeRound = Math.max(1, Math.min(round, GAME_CONFIG.totalImpulseRounds));
  const levelPressure = (safeLevel - 1) * 48;
  const roundPressure = (safeRound - 1) * 28;
  return {
    trialCount: Math.min(
      14,
      9 + Math.floor((safeLevel - 1) / 2) + Math.floor((safeRound - 1) / 2),
    ),
    interval: Math.max(620, 1180 - levelPressure - roundPressure),
  };
}

export function getImpulseRating(accuracy, falseAlarmRate, averageMs) {
  if (
    accuracy >= GAME_CONFIG.impulse.excellentAccuracy &&
    falseAlarmRate <= GAME_CONFIG.impulse.excellentFalseAlarmRate &&
    averageMs !== null &&
    averageMs <= GAME_CONFIG.impulse.excellentAverage
  ) {
    return { label: 'Controlled', tone: 'excellent' };
  }

  if (
    accuracy >= GAME_CONFIG.impulse.goodAccuracy &&
    falseAlarmRate <= GAME_CONFIG.impulse.goodFalseAlarmRate &&
    averageMs !== null &&
    averageMs <= GAME_CONFIG.impulse.goodAverage
  ) {
    return { label: 'Steady', tone: 'good' };
  }

  if (accuracy >= GAME_CONFIG.impulse.okayAccuracy) {
    return { label: 'Watch the impulse', tone: 'okay' };
  }

  return { label: 'Rebuild control', tone: 'slow' };
}

export function getImpulseXp(correctDecisions, totalTrials, accuracy, averageMs, level) {
  const safeCorrect = Math.max(0, Number(correctDecisions) || 0);
  const safeAccuracy = Math.max(0, Math.min(100, Number(accuracy) || 0));
  const safeAverage =
    Number.isFinite(averageMs) && averageMs > 0 ? averageMs : 1500;
  const safeLevel = Math.max(1, Math.min(GAME_CONFIG.maxLevel, Number(level) || 1));
  const speedBonus = Math.max(0, Math.round((1200 - safeAverage) / 40));
  const accuracyBonus = Math.round((safeAccuracy / 100) * 15);
  const trialBonus = Math.min(12, Math.max(0, Number(totalTrials) || 0) - 40);
  return Math.max(
    15,
    20 +
      safeCorrect * 2 +
      accuracyBonus +
      speedBonus +
      trialBonus +
      Math.max(0, safeLevel - 1) * 3,
  );
}
