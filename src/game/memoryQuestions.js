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

export function getMemoryDisplayTime(level) {
  return Math.max(1100, 1800 - (Math.max(1, Math.min(level, 10)) - 1) * 80);
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
    displayTime: getMemoryDisplayTime(level),
  };
}
