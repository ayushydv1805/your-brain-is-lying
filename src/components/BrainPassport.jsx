import { useMemo, useState } from 'react';
import { getAchievementStats } from '../game/achievementEngine';
import {
  createPassportSnapshot,
  createPassportSummary,
  createPassportSvg,
  createPassportUrl,
  getPassportAverageMastery,
  getPassportTotalRuns,
} from '../game/passport';
import { getSkillMastery } from '../game/difficultyEngine';
import '../passport.css';

const ICONS = {
  reaction: '⚡',
  memory: '🧠',
  attention: '👁️',
  logic: '🧩',
  impulse: '🎯',
};

const BESTS = {
  reaction: (player) => (player.bestReaction ? player.bestReaction + ' ms' : '—'),
  memory: (player) => (player.bestMemoryScore ?? 0) + '/5',
  attention: (player) => (player.bestAttentionScore ?? 0) + '/5',
  logic: (player) => (player.bestLogicScore ?? 0) + '/5',
  impulse: (player) => (player.bestImpulseAccuracy ?? 0) + '%',
};

const RUNS = {
  reaction: (player) => player.totalRuns || 0,
  memory: (player) => player.totalMemoryRuns || 0,
  attention: (player) => player.totalAttentionRuns || 0,
  logic: (player) => player.totalLogicRuns || 0,
  impulse: (player) => player.totalImpulseRuns || 0,
};

const SKILLS = [
  { key: 'reaction', label: 'Reaction' },
  { key: 'memory', label: 'Memory' },
  { key: 'attention', label: 'Attention' },
  { key: 'logic', label: 'Logic' },
  { key: 'impulse', label: 'Impulse' },
];

function getDateLabel(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BrainPassport({
  player,
  sharedPassport,
  onPlay,
  onHome,
  onMine,
  onDaily,
  onInsights,
  onReport,
  onAchievements,
}) {
  const isShared = Boolean(sharedPassport);
  const ownSnapshot = useMemo(() => createPassportSnapshot(player), [player]);
  const snapshot = sharedPassport || ownSnapshot;
  const shareUrl = useMemo(
    () => createPassportUrl(ownSnapshot),
    [ownSnapshot],
  );
  const [notice, setNotice] = useState('');

  const averageMastery = getPassportAverageMastery(snapshot);
  const totalRuns = getPassportTotalRuns(snapshot);
  const achievementStats = getAchievementStats(player);
  const achievements = isShared
    ? snapshot.achievementsUnlocked + '/' + snapshot.achievementsTotal
    : achievementStats.unlocked + '/' + achievementStats.total;

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(successMessage);
    } catch {
      setNotice('Clipboard is unavailable in this browser.');
    }
    window.setTimeout(() => setNotice(''), 2200);
  };

  const sharePassport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Your Brain Is Lying · Brain Passport',
          text: 'My current game-progress snapshot.',
          url: shareUrl,
        });
        setNotice('Passport share sheet opened.');
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setNotice('Share was not completed.');
        }
      }
      return;
    }

    await copyText(shareUrl, 'Passport link copied.');
  };

  const downloadCard = () => {
    const svg = createPassportSvg(ownSnapshot);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'brain-passport.svg';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice('Passport card exported.');
  };

  const shareSummary = () => {
    copyText(
      createPassportSummary(ownSnapshot),
      'Passport summary copied.',
    );
  };

  return (
    <div className="passport-page">
      <div className="passport-glow passport-glow-one" aria-hidden="true" />
      <div className="passport-glow passport-glow-two" aria-hidden="true" />

      <header className="passport-topbar">
        <button className="brand" onClick={onHome} aria-label="Go home">
          <span className="brand-mark">🧠</span>
          <span>
            <strong>Your Brain</strong>
            <small>is lying.</small>
          </span>
        </button>

        <div className="passport-topbar-center">
          <span className="passport-live-dot" />
          <span>PHASE 12 · BRAIN PASSPORT</span>
        </div>

        <div className="passport-topbar-actions">
          <button className="ghost-button" onClick={onDaily}>Daily</button>
          <button className="ghost-button" onClick={onInsights}>Insights</button>
          <button className="ghost-button" onClick={onReport}>Report</button>
          <button className="ghost-button" onClick={onAchievements}>Achievements</button>
        </div>
      </header>

      <main className="passport-main">
        {isShared && (
          <section className="passport-shared-banner">
            <div>
              <span className="section-kicker">SHARED SNAPSHOT</span>
              <strong>You&apos;re viewing a read-only Brain Passport.</strong>
              <p>This link contains the snapshot itself. It does not load another player&apos;s private profile.</p>
            </div>
            <button className="primary-button" onClick={onMine}>
              <span>Open my passport</span>
              <span className="button-arrow">→</span>
            </button>
          </section>
        )}

        <section className="passport-hero">
          <div className="passport-hero-copy">
            <span className="section-kicker">PORTABLE GAME PROGRESS</span>
            <h1>Your progress, <span>packaged.</span></h1>
            <p>
              Brain Passport turns your saved game stats into one clean snapshot
              you can share, export, or keep for your own records.
            </p>

            <div className="passport-hero-actions">
              <button className="primary-button" onClick={() => onPlay('reaction')}>
                <span>Run a test</span>
                <span className="button-arrow">→</span>
              </button>
              <button className="ghost-button" onClick={onInsights}>
                Open performance lab
              </button>
            </div>
          </div>

          <div className="passport-orbit">
            <div
              className="passport-ring"
              style={{
                background: 'conic-gradient(#7470ff ' +
                  averageMastery +
                  '%, #252b42 ' +
                  averageMastery +
                  '% 100%)',
              }}
            >
              <div className="passport-ring-inner">
                <span>AVERAGE</span>
                <strong>{averageMastery}%</strong>
                <small>skill mastery</small>
              </div>
            </div>
            <span className="passport-orbit-chip chip-one">LEVEL {snapshot.level}</span>
            <span className="passport-orbit-chip chip-two">{snapshot.xp} XP</span>
            <span className="passport-orbit-chip chip-three">{totalRuns} RUNS</span>
          </div>
        </section>

        <section className="passport-stats">
          <article><span>LEVEL</span><strong>{snapshot.level}</strong><small>current level</small></article>
          <article><span>XP</span><strong>{snapshot.xp}</strong><small>shared progression</small></article>
          <article><span>RUNS</span><strong>{totalRuns}</strong><small>all five skills</small></article>
          <article><span>STREAK</span><strong>{snapshot.currentStreak}</strong><small>current days</small></article>
          <article><span>BEST STREAK</span><strong>{snapshot.bestStreak}</strong><small>saved record</small></article>
          <article><span>ACHIEVEMENTS</span><strong>{achievements}</strong><small>milestones</small></article>
        </section>

        <section className="passport-section">
          <div className="passport-heading">
            <div>
              <span className="section-kicker">FIVE-SKILL FINGERPRINT</span>
              <h2>See your brain <span>at a glance.</span></h2>
            </div>
            <p>Mastery, run count, and personal bests are taken from the game profile available on this browser.</p>
          </div>

          <div className="passport-skill-grid">
            {SKILLS.map((skill) => {
              const mastery = isShared
                ? snapshot.skills.find((item) => item.key === skill.key)?.mastery || 0
                : getSkillMastery(player, skill.key);
              const runs = isShared
                ? snapshot.skills.find((item) => item.key === skill.key)?.runs || 0
                : RUNS[skill.key](player);
              const best = isShared
                ? snapshot.skills.find((item) => item.key === skill.key)?.best || '—'
                : BESTS[skill.key](player);

              return (
                <article className="passport-skill-card" key={skill.key}>
                  <div className="passport-skill-top">
                    <span className="passport-skill-icon">{ICONS[skill.key]}</span>
                    <span>{mastery}%</span>
                  </div>
                  <strong>{skill.label}</strong>
                  <div className="passport-bar">
                    <i style={{ width: mastery + '%' }} />
                  </div>
                  <div className="passport-skill-meta">
                    <div><span>BEST</span><b>{best}</b></div>
                    <div><span>RUNS</span><b>{runs}</b></div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="passport-share-grid">
          <article className="passport-share-card">
            <div className="passport-share-heading">
              <span className="section-kicker">SHARE YOUR SNAPSHOT</span>
              <h2>One link. <span>No account.</span></h2>
              <p>Sharing creates a read-only URL containing only this progress snapshot. Your run history, local storage, and test answers are not included.</p>
            </div>

            {isShared ? (
              <div className="passport-shared-state">
                <span className="passport-state-icon">↗</span>
                <div>
                  <strong>Read-only snapshot</strong>
                  <small>Generated {getDateLabel(snapshot.generatedAt)}</small>
                </div>
              </div>
            ) : (
              <>
                <div className="passport-link-box">
                  <input value={shareUrl} readOnly aria-label="Brain Passport share URL" />
                  <button className="ghost-button" onClick={() => copyText(shareUrl, 'Passport link copied.')}>
                    Copy
                  </button>
                </div>
                <div className="passport-action-row">
                  <button className="primary-button" onClick={sharePassport}>Share link ↗</button>
                  <button className="ghost-button" onClick={downloadCard}>Export SVG card</button>
                  <button className="ghost-button" onClick={shareSummary}>Copy summary</button>
                </div>
              </>
            )}

            {notice && <div className="passport-notice" role="status">{notice}</div>}
          </article>

          <article className="passport-info-card">
            <span className="section-kicker">SHARING MODEL</span>
            <h2>What leaves <span>your browser?</span></h2>
            <div className="passport-info-list">
              <div><b>✓</b><span>Level, XP, streaks, achievements, and five skill summaries.</span></div>
              <div><b>✓</b><span>Personal best labels and run counts for each skill.</span></div>
              <div><b>×</b><span>No account name, raw run history, answers, or local storage data.</span></div>
              <div><b>×</b><span>No server-side profile is created by sharing a passport.</span></div>
            </div>
          </article>
        </section>

        <section className="passport-final-card">
          <div>
            <span className="section-kicker">NEXT MOVE</span>
            <h2>Build the snapshot. <span>Then beat it.</span></h2>
            <p>Your passport reflects progress already earned; the five live challenges are still where new XP and mastery come from.</p>
          </div>
          <div className="passport-final-actions">
            <button className="primary-button" onClick={() => onPlay('reaction')}>
              <span>Play reaction</span>
              <span className="button-arrow">→</span>
            </button>
            <button className="ghost-button" onClick={onHome}>Back home</button>
          </div>
        </section>

        <footer className="passport-footer">
          <span>YOUR BRAIN IS LYING © 2026</span>
          <span>Phase 12 · Brain Passport</span>
        </footer>
      </main>
    </div>
  );
}
