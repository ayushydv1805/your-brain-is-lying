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

### Phase 5 — Adaptive difficulty
- Shared five-tier difficulty engine: Warm Up, Focused, Pressure, Brutal, Insane
- Ten player levels mapped across the five difficulty tiers
- Per-skill mastery for Reaction, Memory, and Attention
- Mastery is blended from recent completed runs and persisted locally
- Strong performance can temporarily push a skill one challenge level harder
- Struggling performance can temporarily pull a skill one challenge level back
- Reaction, Memory, and Attention all consume the same adaptive difficulty profile
- Every result screen shows the difficulty tier used for that run
- Level-up celebration appears when XP crosses a new level
- Level-up screen announces the next difficulty tier
- Dashboard shows current difficulty and each skill's mastery
- Existing localStorage profiles remain backward compatible

## Difficulty model

The game separates **player level** from **challenge level**.

Your player level is controlled by shared XP. Each skill also has its own mastery score from 0–100.

- High mastery (88+) can move that skill one challenge level higher.
- Low mastery (25 or below) can move that skill one challenge level lower.
- Otherwise, the test uses the current player level.
- The adaptive shift is capped at one level and never leaves Levels 1–10.

This keeps the experience personalised without permanently changing the player's account level.

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
- Brain report across all skills
- Achievements and streaks
- Multiplayer / leaderboard backend

### Phase 6 — Logic engine
- Fully playable five-round logic challenge
- Fresh sequence, alternating-rule, equation, ordering, and deduction problems
- Four-option answers with immediate correctness feedback
- Per-round timer that tightens with player level and round number
- Detailed logic result screen with answers and explanations
- Logic score, accuracy, solve speed, XP, and persistent personal best
- Logic mastery feeds the shared adaptive difficulty engine
- Existing localStorage profiles remain backward compatible