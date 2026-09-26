export const ACHIEVEMENTS = [
  { id: 'first-run', icon: '🚀', title: 'First Signal', description: 'Complete your first live brain test.', requirement: '1 completed run', kind: 'runs', target: 1 },
  { id: 'warm-up', icon: '🔥', title: 'Warm-Up Complete', description: 'Finish five brain tests and establish a real baseline.', requirement: '5 completed runs', kind: 'runs', target: 5 },
  { id: 'full-spectrum', icon: '🌈', title: 'Full Spectrum', description: 'Play every skill at least once.', requirement: '5 / 5 skills tested', kind: 'skills', target: 5 },
  { id: 'three-day-streak', icon: '📅', title: 'Three-Day Signal', description: 'Keep the challenge alive for three consecutive days.', requirement: '3 day streak', kind: 'streak', target: 3 },
  { id: 'seven-day-streak', icon: '⚡', title: 'Seven-Day Run', description: 'Return and complete a brain test for seven consecutive days.', requirement: '7 day streak', kind: 'streak', target: 7 },
  { id: 'twenty-five-runs', icon: '🏁', title: 'No Easy Exit', description: 'Complete twenty-five live tests.', requirement: '25 completed runs', kind: 'runs', target: 25 },
  { id: 'reaction-300', icon: '⚡', title: 'Three Hundred', description: 'Record a reaction personal best at or below 300 ms.', requirement: 'Reaction best ≤ 300 ms', kind: 'reaction', target: 1 },
  { id: 'perfect-memory', icon: '🧠', title: 'Memory Lock', description: 'Complete a perfect five-round memory run.', requirement: 'Memory best 5 / 5', kind: 'memory', target: 1 },
  { id: 'laser-attention', icon: '👁️', title: 'Laser Focus', description: 'Complete a perfect five-round attention run.', requirement: 'Attention best 5 / 5', kind: 'attention', target: 1 },
  { id: 'logic-master', icon: '🧩', title: 'Logic Locked', description: 'Complete a perfect five-round logic run.', requirement: 'Logic best 5 / 5', kind: 'logic', target: 1 },
  { id: 'impulse-control', icon: '🎯', title: 'Impulse Control', description: 'Reach at least 95% control accuracy in an impulse run.', requirement: 'Impulse best ≥ 95%', kind: 'impulse', target: 1 },
  { id: 'balanced-brain', icon: '◈', title: 'Balanced Brain', description: 'Bring the average mastery across all five skills to 80%.', requirement: '80% average mastery', kind: 'mastery', target: 80 },
];

function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function skillRuns(player, skill) {
  const map = {
    reaction: player.totalRuns,
    memory: player.totalMemoryRuns,
    attention: player.totalAttentionRuns,
    logic: player.totalLogicRuns,
    impulse: player.totalImpulseRuns,
  };
  return safeNumber(map[skill]);
}

function averageMastery(player) {
  const skills = ['reaction', 'memory', 'attention', 'logic', 'impulse'];
  const total = skills.reduce(
    (sum, skill) => sum + safeNumber(player?.skillMastery?.[skill]),
    0,
  );
  return Math.round(total / skills.length);
}

export function getAchievementProgress(player, achievement) {
  if (!achievement) return 0;

  switch (achievement.kind) {
    case 'runs':
      return Math.min(
        achievement.target,
        safeNumber(player.totalRuns)
          + safeNumber(player.totalMemoryRuns)
          + safeNumber(player.totalAttentionRuns)
          + safeNumber(player.totalLogicRuns)
          + safeNumber(player.totalImpulseRuns),
      );
    case 'skills':
      return ['reaction', 'memory', 'attention', 'logic', 'impulse']
        .filter((skill) => skillRuns(player, skill) > 0).length;
    case 'streak':
      return Math.min(achievement.target, safeNumber(player.currentStreak));
    case 'reaction':
      return player.bestReaction !== null
        && safeNumber(player.bestReaction, 99999) <= 300
        ? 1
        : 0;
    case 'memory':
      return safeNumber(player.bestMemoryScore) >= 5 ? 1 : 0;
    case 'attention':
      return safeNumber(player.bestAttentionScore) >= 5 ? 1 : 0;
    case 'logic':
      return safeNumber(player.bestLogicScore) >= 5 ? 1 : 0;
    case 'impulse':
      return safeNumber(player.bestImpulseAccuracy) >= 95 ? 1 : 0;
    case 'mastery':
      return Math.min(achievement.target, averageMastery(player));
    default:
      return 0;
  }
}

export function isAchievementUnlocked(player, achievementId) {
  const persisted = Array.isArray(player?.unlockedAchievements)
    && player.unlockedAchievements.includes(achievementId);
  const definition = ACHIEVEMENTS.find((item) => item.id === achievementId);
  return persisted
    || getAchievementProgress(player, definition) >= (definition?.target || 1);
}

export function getEligibleAchievementIds(player) {
  return ACHIEVEMENTS
    .filter((achievement) =>
      getAchievementProgress(player, achievement) >= achievement.target,
    )
    .map((achievement) => achievement.id);
}

export function getAchievementById(id) {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id) || null;
}

export function getAchievementStats(player) {
  const unlocked = ACHIEVEMENTS.filter((achievement) =>
    isAchievementUnlocked(player, achievement.id),
  ).length;

  return {
    unlocked,
    total: ACHIEVEMENTS.length,
    progress: Math.round((unlocked / ACHIEVEMENTS.length) * 100),
  };
}
