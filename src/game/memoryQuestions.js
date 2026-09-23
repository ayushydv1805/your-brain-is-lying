const SYMBOLS = [
  '◆',
  '●',
  '▲',
  '■',
  '★',
  '✦',
  '◇',
  '○',
  '△',
  '□',
  '✚',
  '⬟',
];

const MAX_ROUNDS = 5;
const MIN_LEVEL = 1;
const MAX_LEVEL = 10;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffled(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function getMemoryBaseLength(level) {
  const safeLevel = clamp(Number(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL);

  if (safeLevel <= 2) return 4;
  if (safeLevel <= 4) return 5;
  if (safeLevel <= 6) return 6;
  if (safeLevel <= 8) return 7;
  return 8;
}

export function getMemoryLength(level, round = 1) {
  const safeRound = clamp(Number(round) || 1, 1, MAX_ROUNDS);
  return Math.min(8, getMemoryBaseLength(level) + safeRound - 1);
}

export function getMemoryDisplayTime(level, round = 1) {
  const safeLevel = clamp(Number(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL);
  const safeRound = clamp(Number(round) || 1, 1, MAX_ROUNDS);

  const levelPenalty = (safeLevel - 1) * 80;
  const roundPenalty = (safeRound - 1) * 60;

  return Math.max(1000, 1800 - levelPenalty - roundPenalty);
}

export function getMemoryDifficultyLabel(level, round = 1) {
  const length = getMemoryLength(level, round);
  const displayTime = getMemoryDisplayTime(level, round);

  if (length >= 8 || displayTime <= 1100) return 'BRUTAL';
  if (length >= 7 || displayTime <= 1300) return 'HARD';
  if (length >= 5 || displayTime <= 1550) return 'PRESSURE';
  return 'WARM UP';
}

export function createMemoryRound(level, round = 1) {
  const length = getMemoryLength(level, round);
  const sequence = shuffled(SYMBOLS).slice(0, length);

  const decoys = shuffled(
    SYMBOLS.filter((symbol) => !sequence.includes(symbol)),
  ).slice(0, Math.min(3, SYMBOLS.length - length));

  return {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    sequence,
    options: shuffled([...sequence, ...decoys]),
    length,
    displayTime: getMemoryDisplayTime(level, round),
    difficulty: getMemoryDifficultyLabel(level, round),
  };
}
