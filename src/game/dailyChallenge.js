import { getEligibleAchievementIds } from './achievementEngine';

const DAILY_SKILLS = [
  {
    key: 'reaction',
    icon: '⚡',
    label: 'Reaction',
    title: 'Catch the signal without jumping early.',
    detail: 'Stay patient through the wait, then react as soon as the signal appears.',
  },
  {
    key: 'memory',
    icon: '🧠',
    label: 'Memory',
    title: 'Hold the sequence after it disappears.',
    detail: 'Use the normal memory run, but treat today’s completion as your focused daily mission.',
  },
  {
    key: 'attention',
    icon: '👁️',
    label: 'Attention',
    title: 'Find the exact target without drifting.',
    detail: 'Lock onto the matching target and keep near-matches from stealing the search.',
  },
  {
    key: 'logic',
    icon: '🧩',
    label: 'Logic',
    title: 'Reason before the clock makes the decision for you.',
    detail: 'Complete the logic run and keep your choices deliberate rather than rushed.',
  },
  {
    key: 'impulse',
    icon: '🎯',
    label: 'Impulse',
    title: 'Know when to move — and when to stay still.',
    detail: 'Use the impulse run to practice acting on go signals and restraining on no-go signals.',
  },
];

export const DAILY_CHALLENGE_BONUS_XP = 50;

function parseDateInput(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
  return new Date(value);
}

export function getDateKey(value = new Date()) {
  const date = parseDateInput(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function hashDateKey(dateKey) {
  let hash = 0;
  for (let index = 0; index < dateKey.length; index += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getDailyChallenge(value = new Date()) {
  const dateKey = getDateKey(value) || getDateKey(new Date());
  const skill = DAILY_SKILLS[hashDateKey(dateKey) % DAILY_SKILLS.length];
  return { dateKey, ...skill, bonusXp: DAILY_CHALLENGE_BONUS_XP };
}

export function isDailyChallengeCompleted(player, value = new Date()) {
  const dateKey = getDateKey(value);
  return Boolean(
    dateKey &&
      Array.isArray(player?.dailyChallengeDates) &&
      player.dailyChallengeDates.includes(dateKey),
  );
}

export function applyDailyChallengeBonus(player, result) {
  if (!player || !result?.type) return { player, bonusAwarded: 0 };

  const completedDate = getDateKey(result.at || new Date());
  if (!completedDate) return { player, bonusAwarded: 0 };

  const challenge = getDailyChallenge(completedDate);
  const dates = Array.isArray(player.dailyChallengeDates)
    ? player.dailyChallengeDates
    : [];

  if (challenge.key !== result.type || dates.includes(completedDate)) {
    return { player, bonusAwarded: 0 };
  }

  const nextDates = [...new Set([completedDate, ...dates])]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 180);

  const progressPlayer = {
    ...player,
    xp: Math.max(0, Number(player.xp) || 0) + DAILY_CHALLENGE_BONUS_XP,
    dailyChallengeDates: nextDates,
    completedDailyChallenges:
      Math.max(0, Number(player.completedDailyChallenges) || 0) + 1,
  };
  const eligible = getEligibleAchievementIds(progressPlayer);

  return {
    player: {
      ...progressPlayer,
      unlockedAchievements: [
        ...new Set([
          ...(player.unlockedAchievements || []),
          ...eligible,
        ]),
      ],
    },
    bonusAwarded: DAILY_CHALLENGE_BONUS_XP,
  };
}
