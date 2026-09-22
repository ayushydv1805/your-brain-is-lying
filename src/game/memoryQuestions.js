const SYMBOLS = ['◆', '●', '▲', '■', '★', '✦', '◇', '○', '△', '□', '✚', '⬟'];

function shuffled(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function getMemoryLength(level) {
  if (level <= 2) return 4;
  if (level <= 4) return 5;
  if (level <= 6) return 6;
  if (level <= 8) return 7;
  return 8;
}

export function getMemoryDisplayTime(length, level) {
  const base = 850 + length * 260;
  const levelPenalty = Math.max(0, level - 1) * 45;
  return Math.max(1300, base - levelPenalty);
}

export function createMemoryRound(level) {
  const length = getMemoryLength(level);
  const sequence = shuffled(SYMBOLS).slice(0, length);
  const decoys = shuffled(SYMBOLS.filter((symbol) => !sequence.includes(symbol))).slice(
    0,
    Math.min(3, SYMBOLS.length - length),
  );

  return {
    sequence,
    options: shuffled([...sequence, ...decoys]),
    length,
    displayTime: getMemoryDisplayTime(length, level),
  };
}
