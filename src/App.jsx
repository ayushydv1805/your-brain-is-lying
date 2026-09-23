import { useState } from 'react';
import './App.css';
import ReactionTest from './components/ReactionTest';
import MemoryTest from './components/MemoryTest';
import AttentionTest from './components/AttentionTest';
import GameResult from './components/GameResult';
import MemoryResult from './components/MemoryResult';
import AttentionResult from './components/AttentionResult';
import LevelUpCelebration from './components/LevelUpCelebration';
import { getLevelFromXp } from './game/gameConfig';
import { loadPlayer, savePlayer } from './game/storage';
import {
  getDifficultyProfile,
  getDifficultyTier,
  getSkillMastery,
  updateSkillMastery,
} from './game/difficultyEngine';

const tests = [
  {
    icon: '⚡',
    title: 'Reaction',
    text: 'How quickly can you react when your brain is not ready?',
    playable: true,
    action: 'reaction',
  },
  {
    icon: '🧠',
    title: 'Memory',
    text: 'Remember changing sequences before they disappear from view.',
    playable: true,
    action: 'memory',
  },
  {
    icon: '👁️',
    title: 'Attention',
    text: 'Find the exact target while near-matches fight for your attention.',
    playable: true,
    action: 'attention',
  },
  {
    icon: '🧩',
    title: 'Logic',
    text: 'Solve patterns and traps before your first instinct takes over.',
  },
  {
    icon: '🎯',
    title: 'Impulse',
    text: 'Know when to act — and, more importantly, when not to.',
  },
];

const levels = [
  ['01–02', 'Warm Up', 'Learn the rules'],
  ['03–04', 'Focused', 'Cleaner decisions'],
  ['05–06', 'Pressure', 'Faster decisions'],
  ['07–08', 'Brutal', 'Mistakes cost more'],
  ['09–10', 'Insane', 'Push every skill'],
];

function App() {
  const [view, setView] = useState('home');
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [player, setPlayer] = useState(loadPlayer);
  const [result, setResult] = useState(null);
  const [levelUp, setLevelUp] = useState(null);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const startTest = (test) => {
    setResult(null);
    setLevelUp(null);
    setView(test);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startReaction = () => startTest('reaction');
  const startMemory = () => startTest('memory');
  const startAttention = () => startTest('attention');

  const averageMastery = Math.round(
    (
      getSkillMastery(player, 'reaction') +
      getSkillMastery(player, 'memory') +
      getSkillMastery(player, 'attention')
    ) / 3,
  );

  const overallDifficulty = getDifficultyProfile(
    player.level,
    averageMastery,
    'overall',
  );

  const finishReaction = (runResult) => {
    const current = loadPlayer();
    const nextXp = current.xp + runResult.xp;
    const nextPlayer = updateSkillMastery({
      ...current,
      xp: nextXp,
      level: getLevelFromXp(nextXp),
      bestReaction:
        current.bestReaction === null
          ? runResult.best
          : Math.min(current.bestReaction, runResult.best),
      totalRuns: current.totalRuns + 1,
      lastRun: {
        average: runResult.average,
        best: runResult.best,
        at: new Date().toISOString(),
      },
    }, runResult);

    savePlayer(nextPlayer);
    if (nextPlayer.level > current.level) {
      setLevelUp({
        level: nextPlayer.level,
        previousLevel: current.level,
        tier: getDifficultyTier(nextPlayer.level),
      });
    }
    setPlayer(nextPlayer);
    setResult(runResult);
    setView('reaction-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishMemory = (runResult) => {
    const current = loadPlayer();
    const nextXp = current.xp + runResult.xp;
    const nextPlayer = updateSkillMastery({
      ...current,
      xp: nextXp,
      level: getLevelFromXp(nextXp),
      bestMemoryScore: Math.max(current.bestMemoryScore, runResult.score),
      totalMemoryRuns: current.totalMemoryRuns + 1,
      lastMemoryRun: {
        score: runResult.score,
        accuracy: runResult.accuracy,
        at: new Date().toISOString(),
      },
    }, runResult);

    savePlayer(nextPlayer);
    if (nextPlayer.level > current.level) {
      setLevelUp({
        level: nextPlayer.level,
        previousLevel: current.level,
        tier: getDifficultyTier(nextPlayer.level),
      });
    }
    setPlayer(nextPlayer);
    setResult(runResult);
    setView('memory-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishAttention = (runResult) => {
    const current = loadPlayer();
    const nextXp = current.xp + runResult.xp;
    const nextPlayer = updateSkillMastery({
      ...current,
      xp: nextXp,
      level: getLevelFromXp(nextXp),
      bestAttentionScore: Math.max(
        current.bestAttentionScore,
        runResult.score,
      ),
      totalAttentionRuns: current.totalAttentionRuns + 1,
      lastAttentionRun: {
        score: runResult.score,
        accuracy: runResult.accuracy,
        average: runResult.average,
        at: new Date().toISOString(),
      },
    }, runResult);

    savePlayer(nextPlayer);
    if (nextPlayer.level > current.level) {
      setLevelUp({
        level: nextPlayer.level,
        previousLevel: current.level,
        tier: getDifficultyTier(nextPlayer.level),
      });
    }
    setPlayer(nextPlayer);
    setResult(runResult);
    setView('attention-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setView('home');
    setResult(null);
    setLevelUp(null);
    setPlayer(loadPlayer());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'reaction') {
    return (
      <div className="app-shell game-shell">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <ReactionTest
          level={player.level}
          difficultyProfile={getDifficultyProfile(player.level, getSkillMastery(player, 'reaction'), 'reaction')}
          onFinish={finishReaction}
          onExit={goHome}
        />
      </div>
    );
  }

  if (view === 'memory') {
    return (
      <div className="app-shell game-shell">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <MemoryTest
          level={player.level}
          difficultyProfile={getDifficultyProfile(player.level, getSkillMastery(player, 'memory'), 'memory')}
          onFinish={finishMemory}
          onExit={goHome}
        />
      </div>
    );
  }

  if (view === 'attention') {
    return (
      <div className="app-shell game-shell">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <AttentionTest
          level={player.level}
          difficultyProfile={getDifficultyProfile(player.level, getSkillMastery(player, 'attention'), 'attention')}
          onFinish={finishAttention}
          onExit={goHome}
        />
      </div>
    );
  }

  if (view === 'reaction-result' && result) {
    return (
      <div className="app-shell result-shell-page">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <GameResult
          result={result}
          player={player}
          onAgain={startReaction}
          onHome={goHome}
        />
        {levelUp && (
          <LevelUpCelebration
            level={levelUp.level}
            previousLevel={levelUp.previousLevel}
            tier={levelUp.tier}
            onClose={() => setLevelUp(null)}
          />
        )}
      </div>
    );
  }

  if (view === 'memory-result' && result) {
    return (
      <div className="app-shell result-shell-page">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <MemoryResult
          result={result}
          player={player}
          onAgain={startMemory}
          onHome={goHome}
        />
        {levelUp && (
          <LevelUpCelebration
            level={levelUp.level}
            previousLevel={levelUp.previousLevel}
            tier={levelUp.tier}
            onClose={() => setLevelUp(null)}
          />
        )}
      </div>
    );
  }

  if (view === 'attention-result' && result) {
    return (
      <div className="app-shell result-shell-page">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <AttentionResult
          result={result}
          player={player}
          onAgain={startAttention}
          onHome={goHome}
        />
        {levelUp && (
          <LevelUpCelebration
            level={levelUp.level}
            previousLevel={levelUp.previousLevel}
            tier={levelUp.tier}
            onClose={() => setLevelUp(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="noise" aria-hidden="true" />
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />

      <header className="topbar">
        <button
          className="brand"
          onClick={() => scrollTo('home')}
          aria-label="Go home"
        >
          <span className="brand-mark">🧠</span>
          <span>
            <strong>Your Brain</strong>
            <small>is lying.</small>
          </span>
        </button>

        <nav className="nav-links" aria-label="Primary navigation">
          <button onClick={() => scrollTo('tests')}>Tests</button>
          <button onClick={() => scrollTo('levels')}>Levels</button>
          <button onClick={() => scrollTo('about')}>How it works</button>
        </nav>

        <button className="nav-cta" onClick={startReaction}>
          Play test <span>↗</span>
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-dot" />
              <span>YOUR MIND. UNDER PRESSURE.</span>
            </div>

            <h1>
              Don&apos;t trust<span> your first thought.</span>
            </h1>

            <p className="hero-text">
              A fast-paced brain challenge built to test how you react,
              remember, focus, reason, and control your impulses.
            </p>

            <div className="hero-actions">
              <button className="primary-button" onClick={startReaction}>
                <span>Start the challenge</span>
                <span className="button-arrow">→</span>
              </button>

              <button
                className="ghost-button"
                onClick={() => setShowRoadmap((value) => !value)}
              >
                {showRoadmap ? 'Hide roadmap' : 'See the roadmap'}
              </button>
            </div>

            <div className="trust-row">
              <span><b>05</b> brain skills</span>
              <i />
              <span><b>10+</b> difficulty levels</span>
              <i />
              <span><b>∞</b> combinations</span>
            </div>
          </div>

          <div className="brain-stage" aria-label="Game preview">
            <div className="stage-glow" />
            <div className="scan-line" />

            <button
              className="preview-card preview-main preview-play"
              onClick={startReaction}
            >
              <div className="preview-top">
                <span>LEVEL {String(player.level).padStart(2, '0')}</span>
                <span className="live-pill">
                  <i /> PLAYABLE
                </span>
              </div>

              <div className="preview-title">How fast can you react?</div>
              <div className="stroop-word">READY?</div>

              <div className="preview-options">
                <span className="option option-a">WAIT</span>
                <span className="option option-b">WATCH</span>
                <span className="option option-c">REACT</span>
              </div>

              <div className="preview-timer">
                <span>3 LIVE TESTS</span>
                <div><b /></div>
              </div>

              <span className="preview-hint">Click to play →</span>
            </button>

            <div className="floating-card score-card">
              <span className="floating-label">BRAIN XP</span>
              <strong>{player.xp}</strong>
              <small>level {player.level}</small>
            </div>

            <div className="floating-card reaction-card">
              <span className="mini-icon">⚡</span>
              <div>
                <small>BEST REACTION</small>
                <strong>
                  {player.bestReaction
                    ? player.bestReaction + ' ms'
                    : '— ms'}
                </strong>
              </div>
            </div>

            <div className="floating-card streak-card difficulty-floating-card">
              <span>◈</span>
              <strong>{overallDifficulty.tier.shortName}</strong>
              <small>adaptive difficulty</small>
            </div>
          </div>
        </section>

        {showRoadmap && (
          <section className="roadmap-banner">
            <div>
              <span className="section-kicker">BUILD ROADMAP</span>
              <h2>Start simple. Get brutally difficult.</h2>
            </div>

            <div className="roadmap-steps">
              <span><b>01</b> Landing &amp; game shell ✓</span>
              <span><b>02</b> Reaction engine ✓</span>
              <span><b>03</b> Memory engine ✓</span>
              <span><b>04</b> Attention engine ✓</span>
            </div>
          </section>
        )}

        <section className="section tests-section" id="tests">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                FIVE WAYS TO BREAK YOUR FOCUS
              </span>
              <h2>
                Your brain has <span>blind spots.</span>
              </h2>
            </div>

            <p>
              Every test measures a different kind of decision-making. The game
              gets harder as you prove you can handle it.
            </p>
          </div>

          <div className="test-grid">
            {tests.map((test, index) => (
              <article
                className={
                  'test-card ' +
                  (test.playable ? 'test-card-playable' : '')
                }
                key={test.title}
                onClick={
                  test.playable
                    ? () => startTest(test.action)
                    : undefined
                }
                role={test.playable ? 'button' : undefined}
                tabIndex={test.playable ? 0 : undefined}
                onKeyDown={
                  test.playable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          startTest(test.action);
                        }
                      }
                    : undefined
                }
              >
                <div className="card-number">
                  0{index + 1}
                </div>
                <div className="test-icon">{test.icon}</div>
                <h3>{test.title}</h3>
                <p>{test.text}</p>
                <span className="card-arrow">
                  {test.playable
                    ? 'PLAY ↗'
                    : 'SOON'}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="section levels-section" id="levels">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">PROGRESSION SYSTEM</span>
              <h2>
                Same brain. <span>Harder rules.</span>
              </h2>
            </div>

            <p>
              Sequences, timings, visual scans, patterns, and traps keep
              changing — memorising fixed answers will not save you.
            </p>
          </div>

          <div className="level-grid">
            {levels.map(([number, title, text], index) => (
              <article className="level-card" key={number}>
                <span className="level-number">{number}</span>
                <div className="level-line">
                  <span style={{ width: 22 + index * 18 + '%' }} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="difficulty-strip">
            <span>LEVEL 01</span>
            <div className="difficulty-track">
              {Array.from({ length: 8 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <span>LEVEL 10+</span>
            <strong>Can you keep up?</strong>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="about-panel">
            <div className="about-copy">
              <span className="section-kicker">
                PHASE 5 · ADAPTIVE DIFFICULTY
              </span>

              <h2>
                The game <span>learns your level.</span>
              </h2>

              <p>
                Difficulty now responds to both your player level and recent
                performance. Strong runs can push a test one step harder;
                struggling runs can ease it back so the challenge stays useful.
              </p>

              <div className="about-actions">
                <button className="primary-button" onClick={startAttention}>
                  <span>Test my attention</span>
                  <span className="button-arrow">→</span>
                </button>

                <button className="ghost-button" onClick={startMemory}>
                  Memory test
                </button>
              </div>
            </div>

            <div className="stats-panel">
              <div>
                <strong>{player.xp}</strong>
                <span>current XP</span>
              </div>
              <div>
                <strong>{player.level}</strong>
                <span>current level</span>
              </div>
              <div>
                <strong>
                  {player.bestReaction
                    ? player.bestReaction + 'ms'
                    : '—'}
                </strong>
                <span>best reaction</span>
              </div>
              <div>
                <strong>{player.bestMemoryScore}/5</strong>
                <span>best memory</span>
              </div>
              <div>
                <strong>{player.bestAttentionScore}/5</strong>
                <span>best attention</span>
              </div>
              <div>
                <strong>{overallDifficulty.tier.shortName}</strong>
                <span>current difficulty</span>
              </div>
              <div>
                <strong>{getSkillMastery(player, 'reaction')}%</strong>
                <span>reaction mastery</span>
              </div>
              <div>
                <strong>{getSkillMastery(player, 'memory')}%</strong>
                <span>memory mastery</span>
              </div>
              <div>
                <strong>{getSkillMastery(player, 'attention')}%</strong>
                <span>attention mastery</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>YOUR BRAIN IS LYING © 2026</span>
        <span>Phase 5 · Adaptive Difficulty</span>
      </footer>

      {levelUp && (
        <LevelUpCelebration
          level={levelUp.level}
          previousLevel={levelUp.previousLevel}
          tier={levelUp.tier}
          onClose={() => setLevelUp(null)}
        />
      )}
    </div>
  );
}

export default App;
