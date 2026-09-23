const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '0123456789'.split('');

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

function randomCode() {
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const digit = DIGITS[Math.floor(Math.random() * DIGITS.length)];
  return letter + digit;
}

function nearMisses(target) {
  const letter = target[0];
  const digit = target[1];
  const misses = [];

  const add = (value) => {
    if (value !== target && !misses.includes(value)) {
      misses.push(value);
    }
  };

  const nextDigit = DIGITS[(DIGITS.indexOf(digit) + 1) % DIGITS.length];
  const previousDigit =
    DIGITS[(DIGITS.indexOf(digit) - 1 + DIGITS.length) % DIGITS.length];
  const nextLetter =
    LETTERS[(LETTERS.indexOf(letter) + 1) % LETTERS.length];
  const previousLetter =
    LETTERS[(LETTERS.indexOf(letter) - 1 + LETTERS.length) % LETTERS.length];

  add(letter + nextDigit);
  add(letter + previousDigit);
  add(nextLetter + digit);
  add(previousLetter + digit);

  return misses;
}

export function getAttentionBaseGrid(level) {
  const safeLevel = clamp(Number(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL);

  if (safeLevel <= 2) return 3;
  if (safeLevel <= 4) return 4;
  if (safeLevel <= 6) return 5;
  if (safeLevel <= 8) return 6;
  return 7;
}

export function getAttentionGridSize(level, round = 1) {
  const safeRound = clamp(Number(round) || 1, 1, MAX_ROUNDS);
  return Math.min(7, getAttentionBaseGrid(level) + Math.floor((safeRound - 1) / 2));
}

export function getAttentionTimeLimit(level, round = 1) {
  const safeLevel = clamp(Number(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL);
  const safeRound = clamp(Number(round) || 1, 1, MAX_ROUNDS);

  const levelPenalty = (safeLevel - 1) * 220;
  const roundPenalty = (safeRound - 1) * 280;

  return Math.max(1500, 4200 - levelPenalty - roundPenalty);
}

export function getAttentionDifficultyLabel(level, round = 1) {
  const gridSize = getAttentionGridSize(level, round);
  const limit = getAttentionTimeLimit(level, round);

  if (gridSize >= 7 || limit <= 1900) return 'EXTREME';
  if (gridSize >= 6 || limit <= 2500) return 'PRESSURE';
  if (gridSize >= 5 || limit <= 3200) return 'FOCUSED';
  return 'WARM UP';
}

export function createAttentionRound(level, round = 1) {
  const gridSize = getAttentionGridSize(level, round);
  const cellCount = gridSize * gridSize;
  const target = randomCode();
  const distractors = nearMisses(target);

  const pool = [];
  const used = new Set([target]);

  for (const distractor of distractors) {
    if (pool.length < Math.min(distractors.length, Math.ceil(cellCount * 0.35))) {
      pool.push(distractor);
      used.add(distractor);
    }
  }

  while (pool.length < cellCount - 1) {
    const candidate = randomCode();
    if (candidate === target || used.has(candidate)) continue;

    pool.push(candidate);
    used.add(candidate);
  }

  const targetIndex = Math.floor(Math.random() * cellCount);
  const cells = [];
  let poolIndex = 0;

  for (let index = 0; index < cellCount; index += 1) {
    if (index === targetIndex) {
      cells.push(target);
    } else {
      cells.push(pool[poolIndex]);
      poolIndex += 1;
    }
  }

  return {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    target,
    cells: shuffled(cells),
    gridSize,
    timeLimit: getAttentionTimeLimit(level, round),
    difficulty: getAttentionDifficultyLabel(level, round),
  };
}
