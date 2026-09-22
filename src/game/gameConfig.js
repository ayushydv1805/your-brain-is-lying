export const GAME_CONFIG = {
  totalReactionRounds: 5,
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
    minDelay: Math.max(500, Math.round(GAME_CONFIG.reaction.minDelay * (1 - shrink))),
    maxDelay: Math.max(900, Math.round(GAME_CONFIG.reaction.maxDelay * (1 - shrink))),
  };
}

export function getReactionRating(ms) {
  if (ms <= GAME_CONFIG.reaction.excellent) return { label: 'Exceptional', tone: 'excellent' };
  if (ms <= GAME_CONFIG.reaction.good) return { label: 'Sharp', tone: 'good' };
  if (ms <= GAME_CONFIG.reaction.okay) return { label: 'Solid', tone: 'okay' };
  return { label: 'Warm up', tone: 'slow' };
}

export function getReactionXp(averageMs, validRounds) {
  const speedBonus = Math.max(0, Math.round((650 - averageMs) / 8));
  return Math.max(
    10,
    GAME_CONFIG.baseXp + speedBonus + Math.max(0, validRounds - 3) * 5,
  );
}
