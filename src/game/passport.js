const SKILLS = [
  { key: 'reaction', label: 'Reaction' },
  { key: 'memory', label: 'Memory' },
  { key: 'attention', label: 'Attention' },
  { key: 'logic', label: 'Logic' },
  { key: 'impulse', label: 'Impulse' },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

const normalizeSkill = (skill, fallback) => ({
  key: fallback.key,
  label: fallback.label,
  mastery: Math.round(clamp(skill?.mastery, 0, 100)),
  runs: Math.max(0, Math.round(Number(skill?.runs) || 0)),
  best: skill?.best ?? '—',
});

export function createPassportSnapshot(player) {
  const masteryBySkill = player?.skillMastery || {};
  const skills = [
    {
      key: 'reaction',
      label: 'Reaction',
      mastery: masteryBySkill.reaction,
      runs: player?.totalRuns,
      best: player?.bestReaction ? player.bestReaction + ' ms' : '—',
    },
    {
      key: 'memory',
      label: 'Memory',
      mastery: masteryBySkill.memory,
      runs: player?.totalMemoryRuns,
      best: (player?.bestMemoryScore ?? 0) + '/5',
    },
    {
      key: 'attention',
      label: 'Attention',
      mastery: masteryBySkill.attention,
      runs: player?.totalAttentionRuns,
      best: (player?.bestAttentionScore ?? 0) + '/5',
    },
    {
      key: 'logic',
      label: 'Logic',
      mastery: masteryBySkill.logic,
      runs: player?.totalLogicRuns,
      best: (player?.bestLogicScore ?? 0) + '/5',
    },
    {
      key: 'impulse',
      label: 'Impulse',
      mastery: masteryBySkill.impulse,
      runs: player?.totalImpulseRuns,
      best: (player?.bestImpulseAccuracy ?? 0) + '%',
    },
  ].map((skill) => normalizeSkill(skill, skill));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    level: clamp(player?.level, 1, 10),
    xp: Math.max(0, Math.round(Number(player?.xp) || 0)),
    currentStreak: Math.max(0, Math.round(Number(player?.currentStreak) || 0)),
    bestStreak: Math.max(0, Math.round(Number(player?.bestStreak) || 0)),
    completedDailyChallenges: Math.max(
      0,
      Math.round(Number(player?.completedDailyChallenges) || 0),
    ),
    achievementsUnlocked: Math.max(
      0,
      Math.round(Number(player?.unlockedAchievements?.length) || 0),
    ),
    achievementsTotal: 15,
    skills,
  };
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.skills)) {
    return null;
  }

  const skillMap = new Map(snapshot.skills.map((skill) => [skill.key, skill]));
  const skills = SKILLS.map((definition) =>
    normalizeSkill(skillMap.get(definition.key), definition),
  );

  return {
    version: 1,
    generatedAt:
      typeof snapshot.generatedAt === 'string'
        ? snapshot.generatedAt
        : new Date().toISOString(),
    level: clamp(snapshot.level, 1, 10),
    xp: Math.max(0, Math.round(Number(snapshot.xp) || 0)),
    currentStreak: Math.max(0, Math.round(Number(snapshot.currentStreak) || 0)),
    bestStreak: Math.max(0, Math.round(Number(snapshot.bestStreak) || 0)),
    completedDailyChallenges: Math.max(
      0,
      Math.round(Number(snapshot.completedDailyChallenges) || 0),
    ),
    achievementsUnlocked: Math.max(
      0,
      Math.round(Number(snapshot.achievementsUnlocked) || 0),
    ),
    achievementsTotal: Math.max(
      1,
      Math.round(Number(snapshot.achievementsTotal) || 15),
    ),
    skills,
  };
}

export function getPassportAverageMastery(snapshot) {
  if (!snapshot?.skills?.length) return 0;
  return Math.round(
    snapshot.skills.reduce((sum, skill) => sum + skill.mastery, 0) /
      snapshot.skills.length,
  );
}

export function getPassportTotalRuns(snapshot) {
  return (snapshot?.skills || []).reduce((sum, skill) => sum + skill.runs, 0);
}

export function getSharedPassportFromLocation() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  if (params.get('view') !== 'passport') return null;

  const encoded = params.get('passport');
  if (!encoded) return null;

  try {
    return normalizeSnapshot(JSON.parse(encoded));
  } catch {
    return null;
  }
}

export function createPassportUrl(snapshot) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('view', 'passport');
  url.searchParams.set('passport', JSON.stringify(snapshot));
  return url.toString();
}

export function createPassportSummary(snapshot) {
  const skillLines = (snapshot?.skills || [])
    .map(
      (skill) =>
        skill.label +
        ': ' +
        skill.mastery +
        '% mastery · ' +
        skill.runs +
        ' runs · best ' +
        skill.best,
    )
    .join('\n');

  return [
    'YOUR BRAIN IS LYING · BRAIN PASSPORT',
    'Level ' + snapshot.level + ' · ' + snapshot.xp + ' XP',
    'Average mastery: ' + getPassportAverageMastery(snapshot) + '%',
    'Current streak: ' + snapshot.currentStreak + ' days',
    'Best streak: ' + snapshot.bestStreak + ' days',
    'Daily challenges: ' + snapshot.completedDailyChallenges,
    'Achievements: ' +
      snapshot.achievementsUnlocked +
      '/' +
      snapshot.achievementsTotal,
    '',
    skillLines,
  ].join('\n');
}

export function createPassportSvg(snapshot) {
  const escapeXml = (value) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const average = getPassportAverageMastery(snapshot);
  const skillRows = (snapshot?.skills || [])
    .map((skill, index) => {
      const y = 390 + index * 92;
      const width = Math.round((skill.mastery / 100) * 430);
      return [
        '<text x="110" y="',
        y,
        '" fill="#eef0ff" font-size="24" font-family="Arial, sans-serif">',
        escapeXml(skill.label),
        '</text>',
        '<text x="790" y="',
        y,
        '" fill="#8f97b2" font-size="19" text-anchor="end" font-family="Arial, sans-serif">',
        skill.mastery,
        '%',
        '</text>',
        '<rect x="110" y="',
        y + 23,
        '" width="430" height="9" rx="4.5" fill="#252b40"/>',
        '<rect x="110" y="',
        y + 23,
        '" width="',
        width,
        '" height="9" rx="4.5" fill="url(#accent)"/>',
      ].join('');
    })
    .join('');

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">' +
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#11162a"/><stop offset="1" stop-color="#080b16"/></linearGradient><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#726cff"/><stop offset="1" stop-color="#55d5c0"/></linearGradient></defs>' +
    '<rect width="900" height="900" rx="42" fill="url(#bg)"/>' +
    '<circle cx="780" cy="120" r="170" fill="#6d67ff" opacity=".12"/>' +
    '<circle cx="110" cy="780" r="190" fill="#55d5c0" opacity=".06"/>' +
    '<text x="80" y="92" fill="#8e95b0" font-size="17" font-family="Arial, sans-serif" font-weight="700" letter-spacing="3">YOUR BRAIN IS LYING</text>' +
    '<text x="80" y="154" fill="#f5f6ff" font-size="52" font-family="Arial, sans-serif" font-weight="700">BRAIN PASSPORT</text>' +
    '<text x="80" y="192" fill="#8f97b2" font-size="20" font-family="Arial, sans-serif">A portable snapshot of game progress</text>' +
    '<rect x="80" y="230" width="740" height="104" rx="24" fill="#171c33" stroke="#2c3350"/>' +
    '<text x="110" y="267" fill="#737b97" font-size="15" font-family="Arial, sans-serif" font-weight="700" letter-spacing="2">LEVEL</text>' +
    '<text x="110" y="313" fill="#f3f4ff" font-size="42" font-family="Arial, sans-serif" font-weight="700">' +
    snapshot.level +
    '</text>' +
    '<text x="330" y="267" fill="#737b97" font-size="15" font-family="Arial, sans-serif" font-weight="700" letter-spacing="2">XP</text>' +
    '<text x="330" y="313" fill="#f3f4ff" font-size="42" font-family="Arial, sans-serif" font-weight="700">' +
    snapshot.xp +
    '</text>' +
    '<text x="540" y="267" fill="#737b97" font-size="15" font-family="Arial, sans-serif" font-weight="700" letter-spacing="2">MASTERY</text>' +
    '<text x="540" y="313" fill="#f3f4ff" font-size="42" font-family="Arial, sans-serif" font-weight="700">' +
    average +
    '%</text>' +
    skillRows +
    '<text x="80" y="845" fill="#686f8a" font-size="16" font-family="Arial, sans-serif">Progress snapshot · no account name included</text>' +
    '<text x="820" y="845" fill="#686f8a" font-size="16" text-anchor="end" font-family="Arial, sans-serif">2026</text>' +
    '</svg>'
  );
}
