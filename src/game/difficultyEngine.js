const MIN_LEVEL = 1;
const MAX_LEVEL = 10;

export const DIFFICULTY_TIERS = [
  {
    id: 'warm-up',
    name: 'Warm Up',
    shortName: 'WARM UP',
    levels: '01–02',
    colorTone: 'cool',
  },
  {
    id: 'focused',
    name: 'Focused',
    shortName: 'FOCUSED',
    levels: '03–04',
    colorTone: 'calm',
  },
  {
    id: 'pressure',
    name: 'Pressure',
    shortName: 'PRESSURE',
    levels: '05–06',
    colorTone: 'alert',
  },
  {
    id: 'brutal',
    name: 'Brutal',
    shortName: 'BRUTAL',
    levels: '07–08',
    colorTone: 'hot',
  },
  {
    id: 'insane',
    name: 'Insane',
    shortName: 'INSANE',
    levels: '09–10',
    colorTone: 'extreme',
  },
];

const SKILLS = ['reaction', 'memory', 'attention', 'logic'];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeMastery(value) {
  return Number.isFinite(value) ? clamp(value, 0, 100) : 0;
}

export function getDifficultyTier(level) {
  const safeLevel = clamp(Number(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL);
  const index = Math.min(
    DIFFICULTY_TIERS.length - 1,
    Math.floor((safeLevel - 1) / 2),
  );

  return {
    ...DIFFICULTY_TIERS[index],
    level: safeLevel,
    index,
  };
}

export function getAdaptiveLevel(level, mastery = 50) {
  const safeLevel = clamp(Number(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL);
  const safeMastery = sanitizeMastery(mastery);

  let shift = 0;

  if (safeMastery >= 88 && safeLevel < MAX_LEVEL) {
    shift = 1;
  } else if (safeMastery <= 25 && safeLevel > MIN_LEVEL) {
    shift = -1;
  }

  return clamp(safeLevel + shift, MIN_LEVEL, MAX_LEVEL);
}

export function getDifficultyProfile(level, mastery = 50, skill = 'overall') {
  const safeMastery = sanitizeMastery(mastery);
  const effectiveLevel = getAdaptiveLevel(level, safeMastery);
  const tier = getDifficultyTier(effectiveLevel);
  const intensity = Math.round(
    clamp(
      ((effectiveLevel - 1) / (MAX_LEVEL - 1)) * 85 +
        safeMastery * 0.15,
      0,
      100,
    ),
  );

  return {
    skill,
    level: clamp(Number(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL),
    mastery: safeMastery,
    effectiveLevel,
    tier,
    intensity,
    adaptive:
      effectiveLevel !== clamp(Number(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL),
  };
}

export function getSkillMastery(player, skill) {
  if (!SKILLS.includes(skill)) return 0;

  const mastery = player?.skillMastery?.[skill];
  return sanitizeMastery(mastery);
}

export function getMasteryFromResult(result) {
  if (!result || !result.type) return 0;

  if (result.type === 'reaction') {
    const average = Number(result.average);
    if (!Number.isFinite(average)) return 0;

    const speedScore = 100 - ((average - 180) / (700 - 180)) * 100;
    return Math.round(clamp(speedScore, 0, 100));
  }

  if (result.type === 'memory') {
    return Math.round(
      clamp(
        (Number(result.score || 0) / Math.max(1, Number(result.rounds) || 5)) * 100,
        0,
        100,
      ),
    );
  }

  if (result.type === 'logic') {
    const accuracy = clamp(Number(result.accuracy) || 0, 0, 100);
    const average = Number(result.average);
    if (!Number.isFinite(average) || average <= 0) return Math.round(accuracy);
    const speedScore = 100 - ((average - 2800) / (8200 - 2800)) * 100;
    return Math.round(clamp(accuracy * 0.7 + clamp(speedScore, 0, 100) * 0.3, 0, 100));
  }

  if (result.type === 'attention') {
    const accuracy = clamp(Number(result.accuracy) || 0, 0, 100);
    const average = Number(result.average);

    if (!Number.isFinite(average) || average <= 0) {
      return Math.round(accuracy);
    }

    const speedScore = 100 - ((average - 1400) / (4200 - 1400)) * 100;
    return Math.round(
      clamp(accuracy * 0.7 + clamp(speedScore, 0, 100) * 0.3, 0, 100),
    );
  }

  return 0;
}

export function updateSkillMastery(player, result) {
  const skill = result?.type;
  if (!SKILLS.includes(skill)) return player;

  const previous = getSkillMastery(player, skill);
  const latest = getMasteryFromResult(result);
  const blended = previous === 0
    ? latest
    : Math.round(previous * 0.6 + latest * 0.4);

  return {
    ...player,
    skillMastery: {
      ...(player.skillMastery || {}),
      [skill]: clamp(blended, 0, 100),
    },
  };
}

export function getAllSkillMastery(player) {
  return {
    reaction: getSkillMastery(player, 'reaction'),
    memory: getSkillMastery(player, 'memory'),
    attention: getSkillMastery(player, 'attention'),
    logic: getSkillMastery(player, 'logic'),
  };
}
