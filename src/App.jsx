import { useState } from 'react';
import './App.css';
import './daily.css';
import './insights.css';
import './passport.css';
import ReactionTest from './components/ReactionTest';
import MemoryTest from './components/MemoryTest';
import AttentionTest from './components/AttentionTest';
import GameResult from './components/GameResult';
import MemoryResult from './components/MemoryResult';
import AttentionResult from './components/AttentionResult';
import LogicTest from './components/LogicTest';
import LogicResult from './components/LogicResult';
import ImpulseTest from './components/ImpulseTest';
import ImpulseResult from './components/ImpulseResult';
import BrainReport from './components/BrainReport';
import Achievements from './components/Achievements';
import DailyChallenge from './components/DailyChallenge';
import Insights from './components/Insights';
import BrainPassport from './components/BrainPassport';
import AchievementCelebration from './components/AchievementCelebration';
import LevelUpCelebration from './components/LevelUpCelebration';
import { getLevelFromXp } from './game/gameConfig';
import { getAchievementById } from './game/achievementEngine';
import { getSharedPassportFromLocation } from './game/passport';
import { appendRunHistory, loadPlayer, savePlayer } from './game/storage';
import {
  applyDailyChallengeBonus,
  getDailyChallenge,
  isDailyChallengeCompleted,
} from './game/dailyChallenge';
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
    text: 'Solve changing patterns and deductions before the clock closes.',
    playable: true,
    action: 'logic',
  },
  {
    icon: '🎯',
    title: 'Impulse',
    text: 'Know when to act — and, more importantly, when not to.',
    playable: true,
    action: 'impulse',
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
  const [sharedPassport, setSharedPassport] = useState(() => getSharedPassportFromLocation());
  const [view, setView] = useState(() => (getSharedPassportFromLocation() ? 'passport' : 'home'));
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [player, setPlayer] = useState(loadPlayer);
  const [result, setResult] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearPassportQuery = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('passport');
    window.history.replaceState({}, '', url.toString());
  };

  const startTest = (test) => {
    clearPassportQuery();
    setResult(null);
    setLevelUp(null);
    setAchievementQueue([]);
    setView(test);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startReaction = () => startTest('reaction');
  const startMemory = () => startTest('memory');
  const startAttention = () => startTest('attention');
  const startLogic = () => startTest('logic');
  const startImpulse = () => startTest('impulse');

  const averageMastery = Math.round(
    (
      getSkillMastery(player, 'reaction') +
      getSkillMastery(player, 'memory') +
      getSkillMastery(player, 'attention') +
      getSkillMastery(player, 'logic') +
      getSkillMastery(player, 'impulse')
    ) / 5,
  );

  const overallDifficulty = getDifficultyProfile(
    player.level,
    averageMastery,
    'overall',
  );
  const dailyChallenge = getDailyChallenge();
  const dailyCompleted = isDailyChallengeCompleted(player);

  const openDaily = () => {
    clearPassportQuery();
    setResult(null);
    setLevelUp(null);
    setAchievementQueue([]);
    setView('daily');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openInsights = () => {
    clearPassportQuery();
    setResult(null);
    setLevelUp(null);
    setAchievementQueue([]);
    setSharedPassport(null);
    setView('insights');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPassport = () => {
    setResult(null);
    setLevelUp(null);
    setAchievementQueue([]);
    setSharedPassport(null);
    setView('passport');
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('passport');
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finalizeRun = (current, nextPlayer, runResult) => {
    const historyPlayer = appendRunHistory(nextPlayer, runResult);
    const { player: dailyPlayer } = applyDailyChallengeBonus(historyPlayer, runResult);
    const savedPlayer = {
      ...dailyPlayer,
      level: getLevelFromXp(dailyPlayer.xp),
    };
    const previousUnlocked = new Set(current.unlockedAchievements || []);
    const newlyUnlocked = (savedPlayer.unlockedAchievements || [])
      .filter((id) => !previousUnlocked.has(id))
      .map(getAchievementById)
      .filter(Boolean);

    if (newlyUnlocked.length > 0) {
      setAchievementQueue((queue) => {
        const queuedIds = new Set(queue.map((item) => item.id));
        return [
          ...queue,
          ...newlyUnlocked.filter((item) => !queuedIds.has(item.id)),
        ];
      });
    }

    return savedPlayer;
  };

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

    const savedPlayer = finalizeRun(current, nextPlayer, runResult);
    savePlayer(savedPlayer);
    if (savedPlayer.level > current.level) {
      setLevelUp({
        level: savedPlayer.level,
        previousLevel: current.level,
        tier: getDifficultyTier(savedPlayer.level),
      });
    }
    setPlayer(savedPlayer);
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

    const savedPlayer = finalizeRun(current, nextPlayer, runResult);
    savePlayer(savedPlayer);
    if (savedPlayer.level > current.level) {
      setLevelUp({
        level: savedPlayer.level,
        previousLevel: current.level,
        tier: getDifficultyTier(savedPlayer.level),
      });
    }
    setPlayer(savedPlayer);
    setResult(runResult);
    setView('memory-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishLogic = (runResult) => {
    const current = loadPlayer();
    const nextXp = current.xp + runResult.xp;
    const nextPlayer = updateSkillMastery({
      ...current,
      xp: nextXp,
      level: getLevelFromXp(nextXp),
      bestLogicScore: Math.max(current.bestLogicScore, runResult.score),
      totalLogicRuns: current.totalLogicRuns + 1,
      lastLogicRun: { score: runResult.score, accuracy: runResult.accuracy, average: runResult.average, at: new Date().toISOString() },
    }, runResult);
    const savedPlayer = finalizeRun(current, nextPlayer, runResult);
    savePlayer(savedPlayer);
    if (savedPlayer.level > current.level) setLevelUp({ level: savedPlayer.level, previousLevel: current.level, tier: getDifficultyTier(savedPlayer.level) });
    setPlayer(savedPlayer);
    setResult(runResult);
    setView('logic-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishImpulse = (runResult) => {
    const current = loadPlayer();
    const nextXp = current.xp + runResult.xp;
    const nextPlayer = updateSkillMastery({
      ...current,
      xp: nextXp,
      level: getLevelFromXp(nextXp),
      bestImpulseAccuracy: Math.max(
        current.bestImpulseAccuracy,
        runResult.accuracy,
      ),
      totalImpulseRuns: current.totalImpulseRuns + 1,
      lastImpulseRun: {
        accuracy: runResult.accuracy,
        falseAlarmRate: runResult.falseAlarmRate,
        average: runResult.average,
        at: new Date().toISOString(),
      },
    }, runResult);

    const savedPlayer = finalizeRun(current, nextPlayer, runResult);
    savePlayer(savedPlayer);
    if (savedPlayer.level > current.level) {
      setLevelUp({
        level: savedPlayer.level,
        previousLevel: current.level,
        tier: getDifficultyTier(savedPlayer.level),
      });
    }
    setPlayer(savedPlayer);
    setResult(runResult);
    setView('impulse-result');
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

    const savedPlayer = finalizeRun(current, nextPlayer, runResult);
    savePlayer(savedPlayer);
    if (savedPlayer.level > current.level) {
      setLevelUp({
        level: savedPlayer.level,
        previousLevel: current.level,
        tier: getDifficultyTier(savedPlayer.level),
      });
    }
    setPlayer(savedPlayer);
    setResult(runResult);
    setView('attention-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setView('home');
    setResult(null);
    setLevelUp(null);
    setAchievementQueue([]);
    setSharedPassport(null);
    setPlayer(loadPlayer());
    clearPassportQuery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'report') {
    return (
      <BrainReport
        player={player}
        onPlay={startTest}
        onHome={goHome}
        onAchievements={() => {
          setView('achievements');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  if (view === 'achievements') {
    return (
      <Achievements
        player={player}
        onPlay={startTest}
        onHome={goHome}
        onReport={() => {
          setView('report');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  if (view === 'daily') {
    return (
      <DailyChallenge
        player={player}
        onPlay={startTest}
        onHome={goHome}
        onReport={() => {
          setView('report');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAchievements={() => {
          setView('achievements');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  if (view === 'insights') {
    return (
      <Insights
        player={player}
        onPlay={startTest}
        onHome={goHome}
        onDaily={openDaily}
        onReport={() => {
          setView('report');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAchievements={() => {
          setView('achievements');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  if (view === 'passport') {
    return (
      <BrainPassport
        player={player}
        sharedPassport={sharedPassport}
        onPlay={startTest}
        onHome={goHome}
        onMine={openPassport}
        onDaily={openDaily}
        onInsights={openInsights}
        onReport={() => {
          setSharedPassport(null);
          clearPassportQuery();
          setView('report');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAchievements={() => {
          setSharedPassport(null);
          clearPassportQuery();
          setView('achievements');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

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

  if (view === 'logic') {
    return (
      <div className="app-shell game-shell">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <LogicTest level={player.level} difficultyProfile={getDifficultyProfile(player.level, getSkillMastery(player, 'logic'), 'logic')} onFinish={finishLogic} onExit={goHome} />
      </div>
    );
  }

  if (view === 'impulse') {
    return (
      <div className="app-shell game-shell">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <ImpulseTest
          level={player.level}
          difficultyProfile={getDifficultyProfile(
            player.level,
            getSkillMastery(player, 'impulse'),
            'impulse',
          )}
          onFinish={finishImpulse}
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

  if (view === 'logic-result' && result) {
    return (
      <div className="app-shell result-shell-page">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <LogicResult result={result} player={player} onAgain={startLogic} onHome={goHome} />
        {levelUp && <LevelUpCelebration level={levelUp.level} previousLevel={levelUp.previousLevel} tier={levelUp.tier} onClose={() => setLevelUp(null)} />}
      </div>
    );
  }

  if (view === 'impulse-result' && result) {
    return (
      <div className="app-shell result-shell-page">
        <div className="noise" aria-hidden="true" />
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <ImpulseResult
          result={result}
          player={player}
          onAgain={startImpulse}
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
          <button onClick={openDaily}>Daily</button>
          <button onClick={openInsights}>Insights</button>
          <button onClick={openPassport}>Passport</button>
          <button onClick={() => setView('report')}>Report</button>
          <button onClick={() => setView('achievements')}>Achievements</button>
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
              <i />
              <button className="hero-report-link" onClick={openDaily}>Today&apos;s daily ↗</button>
              <button className="hero-report-link" onClick={openInsights}>Performance ↗</button>
              <button className="hero-report-link" onClick={openPassport}>Passport ↗</button>
              <button className="hero-report-link" onClick={() => setView('report')}>View report ↗</button>
            </div>

            <div className="mobile-quick-nav" aria-label="Quick navigation">
              <button onClick={() => scrollTo('tests')}>Tests</button>
              <button onClick={openDaily}>Daily</button>
              <button onClick={openInsights}>Insights</button>
              <button onClick={openPassport}>Passport</button>
              <button onClick={() => setView('report')}>Report</button>
              <button onClick={() => setView('achievements')}>Achievements</button>
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
                <span>5 LIVE TESTS</span>
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
              <span><b>05</b> Adaptive difficulty ✓</span>
              <span><b>06</b> Logic engine ✓</span>
              <span><b>07</b> Impulse control ✓</span>
              <span><b>08</b> Brain report ✓</span>
              <span><b>09</b> Achievements &amp; streaks ✓</span>
              <span><b>10</b> Daily brain challenge ✓</span>
              <span><b>11</b> Performance lab ✓</span>
              <span><b>12</b> Brain Passport ✓</span>
            </div>
          </section>
        )}

        <section className="daily-teaser">
          <div className="daily-teaser-copy">
            <span className="section-kicker">PHASE 10 · DAILY CHALLENGE</span>
            <h2>One challenge. <span>Every day.</span></h2>
            <p>
              Today&apos;s mission rotates by local calendar day. Finish the assigned skill once
              before the day ends and earn <strong>+{dailyChallenge.bonusXp} XP</strong> on top of the normal run reward.
            </p>
          </div>
          <div className="daily-teaser-card">
            <div className="daily-teaser-top">
              <span>{dailyChallenge.icon}</span>
              <span className={dailyCompleted ? 'daily-status is-done' : 'daily-status'}>
                {dailyCompleted ? 'COMPLETED TODAY' : 'READY TODAY'}
              </span>
            </div>
            <strong>{dailyChallenge.label}</strong>
            <small>{dailyChallenge.title}</small>
            <button className="primary-button" onClick={openDaily}>
              <span>{dailyCompleted ? 'View today&apos;s challenge' : 'Open daily challenge'}</span>
              <span className="button-arrow">→</span>
            </button>
          </div>
        </section>

        <section className="insights-teaser">
          <div className="insights-teaser-copy">
            <span className="section-kicker">PHASE 11 · PERFORMANCE LAB</span>
            <h2>See the pattern behind <span>your runs.</span></h2>
            <p>Turn saved runs into a clean timeline of skill mix, active days, mastery, and recent performance.</p>
          </div>
          <div className="insights-mini-grid">
            <div><strong>{player.runHistory?.length || 0}</strong><span>saved runs</span></div>
            <div><strong>{player.activityDates?.length || 0}</strong><span>active days</span></div>
            <div><strong>{player.currentStreak || 0}</strong><span>day streak</span></div>
            <div><strong>{player.level}</strong><span>level</span></div>
          </div>
          <button className="primary-button" onClick={openInsights}>
            <span>Open performance lab</span>
            <span className="button-arrow">→</span>
          </button>
        </section>

        <section className="passport-teaser">
          <div>
            <span className="section-kicker">PHASE 12 · BRAIN PASSPORT</span>
            <h2>Package your progress. <span>Take it with you.</span></h2>
            <p>Create a read-only share link or export a clean SVG card from the progress already saved on this browser.</p>
          </div>
          <div className="passport-mini-grid">
            <div><strong>{averageMastery}%</strong><span>avg mastery</span></div>
            <div><strong>{player.currentStreak || 0}</strong><span>day streak</span></div>
            <div><strong>{player.level}</strong><span>level</span></div>
            <div><strong>{player.unlockedAchievements?.length || 0}</strong><span>achievements</span></div>
          </div>
          <button className="primary-button" onClick={openPassport}>
            <span>Open brain passport</span>
            <span className="button-arrow">→</span>
          </button>
        </section>

        <section className="report-teaser-section">
          <div className="report-teaser-copy">
            <span className="section-kicker">YOUR PROGRESS, COMPILED</span>
            <h2>Stop guessing. <span>Read the report.</span></h2>
            <p>
              See every skill's mastery, personal best, run count, XP progress,
              adaptive difficulty, and recent attempts in one place.
            </p>
          </div>
          <button className="primary-button" onClick={() => setView('report')}>
            <span>Open brain report</span>
            <span className="button-arrow">→</span>
          </button>
        </section>

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
                PHASE 12 · BRAIN PASSPORT
              </span>

              <h2>
                Make progress <span>portable.</span>
              </h2>

              <p>
                Package the progress already earned on this browser into a clean snapshot.
                Share it as a read-only link or export a standalone SVG card without uploading
                your account profile to a backend.
              </p>

              <div className="about-actions">
                <button className="primary-button" onClick={openPassport}>
                  <span>Open brain passport</span>
                  <span className="button-arrow">→</span>
                </button>

                <button className="ghost-button" onClick={openInsights}>
                  Performance lab
                </button>
              </div>
            </div>

            <div className="stats-panel">
              <div>
                <strong>{player.xp}</strong>
                <span>current XP</span>
              </div>
              <div>
                <strong>{player.currentStreak || 0}</strong>
                <span>current streak</span>
              </div>
              <div>
                <strong>{player.bestStreak || 0}</strong>
                <span>best streak</span>
              </div>
              <div>
                <strong>{player.completedDailyChallenges || 0}</strong>
                <span>daily challenges completed</span>
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
                <strong>{player.bestLogicScore}/5</strong>
                <span>best logic</span>
              </div>
              <div>
                <strong>{player.bestImpulseAccuracy}%</strong>
                <span>best impulse accuracy</span>
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
              <div>
                <strong>{getSkillMastery(player, 'logic')}%</strong>
                <span>logic mastery</span>
              </div>
              <div>
                <strong>{getSkillMastery(player, 'impulse')}%</strong>
                <span>impulse mastery</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>YOUR BRAIN IS LYING © 2026</span>
        <span>Phase 12 · Brain Passport</span>
      </footer>

      {levelUp && (
        <LevelUpCelebration
          level={levelUp.level}
          previousLevel={levelUp.previousLevel}
          tier={levelUp.tier}
          onClose={() => setLevelUp(null)}
        />
      )}

      {achievementQueue.length > 0 && !levelUp && (
        <AchievementCelebration
          achievement={achievementQueue[0]}
          onClose={() =>
            setAchievementQueue((queue) => queue.slice(1))
          }
        />
      )}
    </div>
  );
}

export default App;