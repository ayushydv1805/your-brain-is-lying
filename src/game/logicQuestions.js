function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function makeOptions(correct, distractors) {
  const options = [String(correct)];
  for (const distractor of distractors) {
    const value = String(distractor);
    if (value !== String(correct) && !options.includes(value)) options.push(value);
  }
  let offset = 1;
  while (options.length < 4) {
    const fallback = String(Number(correct) + offset * (offset % 2 === 0 ? -1 : 1) * 2);
    if (!options.includes(fallback)) options.push(fallback);
    offset += 1;
  }
  return shuffle(options.slice(0, 4));
}

function numberSequence(level) {
  const start = Math.floor(Math.random() * 8) + 2;
  const step = Math.floor(Math.random() * 5) + 2;
  const growth = level >= 5 ? Math.floor(Math.random() * 3) + 1 : 0;
  const values = [start];
  let diff = step;
  for (let i = 1; i < 5; i += 1) {
    values.push(values[i - 1] + diff);
    diff += growth;
  }
  const correct = values[4] + diff;
  return {
    type: 'sequence',
    label: growth ? 'INCREASING DIFFERENCES' : 'NUMBER SEQUENCE',
    question: 'What number should come next?',
    sequence: values.join('   →   ') + '   →   ?',
    options: makeOptions(correct, [correct + step, correct - step, correct + growth + 1]),
    correct,
    explanation: growth
      ? 'The gaps grow by ' + growth + ' each time, so the next gap is ' + diff + '.'
      : 'The sequence increases by ' + step + ' each time.',
  };
}

function alternatingSequence() {
  const first = Math.floor(Math.random() * 7) + 3;
  const add = Math.floor(Math.random() * 4) + 3;
  const subtract = Math.floor(Math.random() * 3) + 1;
  const values = [first, first + add];
  for (let i = 2; i < 5; i += 1) {
    const previous = values[i - 1];
    values.push(i % 2 === 0 ? previous - subtract : previous + add);
  }
  const correct = values[4] + add;
  return {
    type: 'alternating',
    label: 'ALTERNATING RULE',
    question: 'Two rules are repeating. What comes next?',
    sequence: values.join('   →   ') + '   →   ?',
    options: makeOptions(correct, [correct - subtract, correct + subtract, correct + add + 2]),
    correct,
    explanation: 'The pattern alternates +' + add + ', then −' + subtract + '.',
  };
}

function missingEquation(level) {
  const a = Math.floor(Math.random() * 6) + 2;
  const b = Math.floor(Math.random() * 5) + 2;
  const multiplier = level >= 7 ? 3 : 2;
  const c = a + b;
  const correct = c * multiplier;
  return {
    type: 'equation',
    label: 'HIDDEN OPERATOR',
    question: 'Find the value that follows the same rule.',
    sequence: a + ' + ' + b + ' = ' + c + '   |   ' + c + ' × ' + multiplier + ' = ?',
    options: makeOptions(correct, [correct + multiplier, correct - multiplier, correct + a]),
    correct,
    explanation: 'First combine ' + a + ' and ' + b + ' to get ' + c + '; then multiply by ' + multiplier + '.',
  };
}

function orderingPuzzle() {
  const people = shuffle(['A', 'B', 'C', 'D']);
  const a = people[0], b = people[1], c = people[2], d = people[3];
  return {
    type: 'ordering',
    label: 'ORDER LOGIC',
    question: b + ' is before ' + a + '. ' + c + ' is after ' + a + '. ' + d + ' is before ' + c + ' but after ' + b + '. Which must be true?',
    options: [
      b + ' is before ' + d,
      a + ' is before ' + b,
      c + ' is before ' + a,
      d + ' is after ' + c,
    ],
    correct: b + ' is before ' + d,
    explanation: b + ' must be before ' + a + ', and ' + d + ' sits between ' + b + ' and ' + c + '.',
  };
}

function syllogismPuzzle() {
  const sets = shuffle([
    {
      text: 'All Zens are Fars. No Fars are Meks. Which conclusion must be true?',
      options: ['No Zens are Meks.', 'Some Zens are Meks.', 'All Meks are Zens.', 'Some Fars are Meks.'],
      correct: 'No Zens are Meks.',
      explanation: 'Anything that is a Zen is a Far, and Fars cannot be Meks.',
    },
    {
      text: 'All Rids are Kels. Some Rids are Tovs. Which conclusion must be true?',
      options: ['Some Kels are Tovs.', 'No Kels are Tovs.', 'All Tovs are Rids.', 'No Rids are Kels.'],
      correct: 'Some Kels are Tovs.',
      explanation: 'The Rids that are Tovs are also Kels because every Rid is a Kel.',
    },
  ]);
  return {
    type: 'syllogism',
    label: 'DEDUCTIVE LOGIC',
    question: sets.text,
    options: shuffle(sets.options),
    correct: sets.correct,
    explanation: sets.explanation,
  };
}

export function createLogicRound(level, round) {
  const safeLevel = Math.max(1, Math.min(10, Number(level) || 1));
  const types = [numberSequence, alternatingSequence, missingEquation, orderingPuzzle, syllogismPuzzle];
  const generator = types[(round - 1) % types.length];
  const generated = generator(safeLevel);
  return {
    ...generated,
    round,
    level: safeLevel,
    difficulty: safeLevel >= 9 ? 'INSANE' : safeLevel >= 7 ? 'BRUTAL' : safeLevel >= 5 ? 'PRESSURE' : safeLevel >= 3 ? 'FOCUSED' : 'WARM UP',
    correct: String(generated.correct),
    options: generated.options.map(String),
  };
}
