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
- Per-skill mastery for Reaction, Memory, Attention, Logic, and Impulse
- Mastery is blended from recent completed runs and persisted locally
- Strong performance can temporarily push a skill one challenge level harder
- Struggling performance can temporarily pull a skill one challenge level back
- All five skills consume the same adaptive difficulty profile
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

- Multiplayer / leaderboard backend

### Phase 6 — Logic engine
- Fully playable five-round logic challenge
- Fresh sequence, alternating-rule, equation, ordering, and deduction problems
- Four-option answers with immediate correctness feedback
- Fixed 60-second window per logic run, with adaptive question difficulty
- Detailed logic result screen with answers and explanations
- Logic score, accuracy, solve speed, XP, and persistent personal best
- Logic mastery feeds the shared adaptive difficulty engine
- Existing localStorage profiles remain backward compatible

### Phase 7 — Impulse control
- Fully playable five-round response-inhibition challenge
- Fresh target symbols and changing go/no-go signals each run
- Correct hits, missed go signals, correct restraint, and false alarms tracked separately
- Signal speed tightens with player level and round progression
- Dedicated impulse result report with control accuracy and response metrics
- Impulse XP, best accuracy, run history, and persistent mastery
- Impulse mastery feeds the shared adaptive difficulty engine
- Existing localStorage profiles remain backward compatible

### Phase 8 — Brain report
- Dedicated report dashboard across all five live skills
- Shared XP, current level, average mastery, and adaptive difficulty snapshot
- Per-skill mastery bars, completed run counts, and personal bests
- Highest/lowest current mastery shown as descriptive dashboard metrics
- Recent local run history with skill, result metric, XP, and timestamp
- Direct replay buttons for every skill
- Backward-compatible localStorage migration for existing players

### Phase 9 — Achievements & streaks
- Persistent achievement system across all five cognitive skills
- Twelve milestone achievements covering runs, skill coverage, streaks, best scores, mastery, and progression
- Three-day and seven-day consistency streaks
- Best streak tracking with local calendar activity
- Automatic achievement unlock detection after completed runs
- Dedicated achievements dashboard with All / Unlocked / Locked filters
- Fourteen-day activity strip showing daily test consistency
- Achievement unlock celebration after milestones are reached
- Existing player profiles migrate safely and recover activity from recent run history

### Phase 10 — Daily Brain Challenge
- Deterministic daily mission rotating across Reaction, Memory, Attention, Logic, and Impulse
- One-time +50 XP daily bonus for completing the assigned skill each local calendar day
- Dedicated daily challenge dashboard with today&apos;s mission, completion state, and seven-day history
- Daily challenge entry points on the landing page and responsive navigation
- Three daily-completion achievements integrated into the existing achievement system
- Backward-compatible localStorage migration for existing players

### Phase 11 — Performance Lab
- Dedicated performance dashboard built from the existing local run history and activity dates
- Five skill cards showing mastery, best metric, and run count
- Fourteen-day consistency strip and seven-day recent run mix
- Recent-run timeline with relative timestamps and readable metrics
- Descriptive progress insights without changing core game scoring
- Fixed daily-achievement persistence when a daily milestone is earned

### Phase 12 — Brain Passport
- Portable progress snapshot across level, XP, streaks, achievements, and all five skill summaries
- Read-only share links generated entirely in the browser with no account name included
- Share URL contains only the selected progress snapshot; raw run history and test answers remain local
- Standalone SVG passport card export for saving or posting progress elsewhere
- Copyable text summary plus Web Share / clipboard support
- Shared-passport view with a clear read-only state and a path back to the local player profile
- Responsive landing-page teaser and navigation entry points for desktop and mobile


## Local profiles and persistent progress

The app now opens through a local sign-in / account-creation screen. Profiles are stored on the current browser or app installation, and each profile has its own XP, levels, scores, streaks, achievements, and run history. Existing pre-login progress is migrated to the first profile created on that installation.

- Passwords are verified with PBKDF2-SHA-256 instead of being stored as plain text.
- Progress is saved in local storage so it survives closing and reopening the app.
- The account menu includes **Download progress backup** and **Restore from backup**.
- The recent run history keeps up to 500 results.

**Important:** these are local device profiles, not online accounts. They work offline and do not sync between devices. Clearing browser/app storage can remove local data, so download backups periodically. Before launching a public multi-device product, use a real authentication/database backend for verified email, password recovery, and secure sync.

## Build verification

The GitHub Actions workflow runs the production Vite build for branch pushes and pull requests.

~~~bash
npm install
npm run build
~~~


## Phases A and B — Quality, coaching, and practice planning

The latest update adds:
- A reusable round-by-round mistake review after all five game modes.
- A rule-based Brain Coach that recommends practice using local mastery and recent completed runs. It does not send player data to an external AI service.
- Personalized 5-, 10-, and 15-minute training plans.
- A weekly report comparing the latest seven days with the preceding seven days, daily activity, XP totals, skill mix, and JSON export.
- Locally saved comfort preferences: reduced motion, higher contrast, larger text, and simplified decoration.
- Player-save schema metadata, numeric metrics in run history, save verification, storage status, and a timestamped recovery copy when saved JSON is corrupt.
- Automated tests using Node's built-in test runner. The CI workflow runs tests before the Vite production build.

Run checks locally:

~~~bash
npm test
npm run build
~~~

The Brain Coach uses transparent, deterministic rules on saved game results; it is not a remote generative-AI feature and is not intended for medical, diagnostic, or intelligence assessment.


## Phase C — Real cloud accounts and cross-device sync

The app supports Supabase email/password authentication when both Vite environment variables are configured. Cloud accounts use Supabase Auth (including email confirmation and password reset); the browser never receives a service-role/secret key. Each account gets a public handle/profile and a private progress row protected by Row Level Security (RLS). Saved runs are synced to the account after progress saves; cloud changes can flow back through Supabase Realtime when the project's Realtime publication is enabled.

A cloud user can also import an existing device-local profile or restore a JSON backup after signing in. Local profiles remain available when cloud credentials are not configured.

## Phase D — Friends, head-to-head challenges, and leaderboards

- Search for players by their unique handle and send/accept/decline friend requests.
- Send a friend a challenge for one of the five skills. The invited player accepts it; both players complete a fresh run and submit one comparable 0–100 score.
- View each challenge's submitted scores, copy its invite code, and see the outcome after both submissions.
- Enter skill-specific **weekly tournaments** or all-time leaderboards by manually publishing saved results.
- Leaderboard sharing is opt-in and off by default. Public-facing views expose the chosen handle, avatar and submitted score—not email or private progress history.

These rankings are for friendly competition. Scores are submitted by the client, so they are not fraud-proof enough for prizes, money, or other high-stakes competition.

## Configure the cloud backend (required to turn on Phases C/D)

For security, this repository does not contain a live database URL, publishable key, or service-role key, and the Phase C/D schema has **not** been applied automatically to any existing Supabase project. Use a dedicated Supabase project for this app; do not point this app at another production app's database.

1. In your Supabase dashboard, open the project's SQL Editor and run the complete file supabase/phase-c-d-schema.sql. This creates the profile, private progress, friend request, challenge, score and leaderboard tables plus RLS policies, triggers and indexes.
2. In **Authentication → Providers**, enable email/password sign-in. Set the project's Site URL and Redirect URLs to the actual development and production origins you use, so confirmation and reset links return to this app.
3. In **Project Settings / API**, copy the project URL and its **publishable key** (or legacy anon key). Never use the service_role or secret key in a browser/mobile build.
4. Copy .env.example to .env in the project root and replace the placeholders:

   ~~~env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_WITH_YOUR_KEY
   ~~~

5. If the project does not expose public through the Data API, add public in the project's Data API exposed-schema settings. Keep RLS enabled on every table; the SQL includes explicit table grants and row-level policies.
6. Run npm install, npm test, and npm run dev. Create two separate test accounts to verify the complete friend-request and challenge flow. The new cloud-login screen appears only when the two environment variables are set; without them the existing device-local login remains available.

Because .env is ignored by Git, keep your real project values in your local environment or deployment provider's environment settings—not in a commit. For an Android/desktop package, also add the final app's allowed redirect URL(s) to the Supabase Auth settings before distributing it.

## Phase C/D verification

The automated suite includes deterministic tests for cloud progress merging, duplicate run de-duplication, normalized reaction scoring, skill score calculations, and invalid cross-skill submissions. GitHub Actions runs npm test followed by the Vite production build on pushes and pull requests.
