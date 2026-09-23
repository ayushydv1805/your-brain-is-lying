# Your Brain Is Lying 🧠

A fast-paced cognitive challenge game built with React + Vite.

## Current build

### Phase 1 — Foundation
- Premium landing experience
- Five cognitive skill categories
- Progression concept
- Responsive visual system

### Phase 2 — Reaction engine
- Five valid reaction rounds per run
- Random signal timing
- False-start detection
- Millisecond reaction measurement
- Timing becomes tighter as the player levels up
- XP and level progression
- Persistent personal best using localStorage
- Detailed reaction result screen

### Phase 3 — Memory engine
- Fully playable five-round memory challenge
- A new sequence is generated for every round
- Sequence symbols are shuffled so fixed answers cannot be memorised
- Exact-order recall
- Incorrect-order detection
- Round difficulty scales through longer sequences and shorter viewing windows
- Countdown feedback
- Detailed round-by-round memory report
- Persistent best memory score
- Memory XP contributes to the shared level system

### Phase 4 — Attention engine
- Fully playable five-round visual-search challenge
- A fresh target and fresh grid are generated every round
- Exactly one target matches both characters
- Distractors include near-matches to increase visual search difficulty
- Grid grows as rounds and player levels progress
- Search time limit becomes tighter with difficulty
- Timeout handling and target reveal on missed rounds
- Per-round search timing and correctness tracking
- Dedicated attention result screen with round breakdown
- Accuracy, average search time, best search time, rating, and XP
- Persistent best attention score
- Attention XP contributes to the shared player progression

## Attention difficulty

At lower levels the field starts smaller and gives more time to scan. As the player progresses, the grid can reach 7×7 while the search window tightens.

Every run remains exactly five rounds, but the target code and all distractors are regenerated so previous answers do not help.

## Development

~~~bash
npm install
npm run dev
~~~

Production build:

~~~bash
npm run build
npm run preview
~~~

## Planned

- Logic challenge
- Impulse-control challenge
- Higher difficulty tiers
- Brain report across all skills
- Achievements and streaks
- Multiplayer / leaderboard backend
