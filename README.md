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
- Exact-order recall: every click must match the next expected symbol
- One incorrect symbol immediately ends the current round
- Round difficulty scales through longer sequences and shorter viewing windows
- Level difficulty also tightens the viewing window
- Clear round progress: Round 1 / 5 through Round 5 / 5
- Countdown bar shows the active memorisation window
- Round score, sequence length, recalled count, and difficulty are visible during play
- Detailed post-run breakdown showing the sequence seen and the sequence entered
- Memory accuracy, rating, XP, and best score are persisted with the player profile
- Memory XP contributes to the same level progression used by the reaction test
- Responsive controls and accessible answer buttons

### Memory difficulty
At Level 1, the five rounds progress from 4 to 8 symbols while the viewing window tightens from 1800ms toward 1000ms.

Higher player levels start with longer sequences and/or less viewing time, while the run always remains exactly five rounds.

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

- Attention challenge
- Logic challenge
- Impulse-control challenge
- More procedural question generators
- Higher difficulty tiers
- Brain report across all skills
- Achievements and streaks
- Multiplayer / leaderboard backend
