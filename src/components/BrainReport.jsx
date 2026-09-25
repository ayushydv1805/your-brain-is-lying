import DifficultyBadge from './DifficultyBadge';
import { GAME_CONFIG, getLevelProgress } from '../game/gameConfig';
import { getDifficultyProfile, getSkillMastery } from '../game/difficultyEngine';

const SKILLS = [
  {
    key: 'reaction',
    label: 'Reaction',
    icon: '⚡',
    description: 'Speed when the signal changes.',
    action: 'reaction',
  },
  {
    key: 'memory',
    label: 'Memory',
    icon: '🧠',
    description: 'Recall under changing patterns.',
    action: 'memory',
  },
  {
    key: 'attention',
    label: 'Attention',
    icon: '👁️',
    description: 'Find the target without drifting.',
    action: 'attention',
  },
  {
    key: 'logic',
    label: 'Logic',
    icon: '🧩',
    description: 'Reason through patterns and rules.',
    action: 'logic',
  },
  {
    key: 'impulse',
    label: 'Impulse',
    icon: '🎯',
    description: 'Act on go. Restrain on no-go.',
    action: 'impulse',
  },
];

function getRuns(player, key) {
  const map = {
    reaction: player.totalRuns,
    memory: player.totalMemoryRuns,
    attention: player.totalAttentionRuns,
    logic: player.totalLogicRuns,
    impulse: player.totalImpulseRuns,
  };
  return Math.max(0, Number(map[key]) || 0);
}

function getBest(player, key) {
  const map = {
    reaction: player.bestReaction === null || player.bestReaction === undefined
      ? '—'
      : player.bestReaction + ' ms',
    memory: (player.bestMemoryScore || 0) + '/5',
    attention: (player.bestAttentionScore || 0) + '/5',
    logic: (player.bestLogicScore || 0) + '/5',
    impulse: (player.bestImpulseAccuracy || 0) + '%',
  };
  return map[key];
}

function getHistoryMetric(run) {
  if (run.type === 'reaction') return run.metric || '—';
  if (run.type === 'memory') return run.metric || '—';
  if (run.type === 'attention') return run.metric || '—';
  if (run.type === 'logic') return run.metric || '—';
  if (run.type === 'impulse') return run.metric || '—';
  return '—';
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown time';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BrainReport({ player, onPlay, onHome }) {
  const masteryValues = SKILLS.map((skill) => getSkillMastery(player, skill.key));
  const averageMastery = Math.round(
    masteryValues.reduce((sum, value) => sum + value, 0) / SKILLS.length,
  );
  const totalRuns = SKILLS.reduce(
    (sum, skill) => sum + getRuns(player, skill.key),
    0,
  );
  const highestSkill = SKILLS.reduce((best, skill) =>
    getSkillMastery(player, skill.key) > getSkillMastery(player, best.key)
      ? skill
      : best,
  );
  const lowestSkill = SKILLS.reduce((best, skill) =>
    getSkillMastery(player, skill.key) < getSkillMastery(player, best.key)
      ? skill
      : best,
  );
  const difficulty = getDifficultyProfile(
    player.level,
    averageMastery,
    'overall',
  );
  const progress = getLevelProgress(player.xp);
  const xpToNext =
    player.level >= GAME_CONFIG.maxLevel
      ? 0
      : GAME_CONFIG.xpPerLevel - (player.xp % GAME_CONFIG.xpPerLevel);
  const history = Array.isArray(player.runHistory) ? player.runHistory : [];

  return (
    <div className="report-page">
      <div className="report-backdrop" aria-hidden="true" />
      <header className="report-topbar">
        <button className="brand report-brand" onClick={onHome}>
          <span className="brand-mark">🧠</span>
          <span>
            <strong>Your Brain</strong>
            <small>is lying.</small>
          </span>
        </button>
        <div className="report-topbar-actions">
          <span className="report-live-dot" />
          <span>PERSONAL BRAIN REPORT</span>
        </div>
        <button className="ghost-button report-home" onClick={onHome}>
          Back home
        </button>
      </header>

      <main className="report-main">
        <section className="report-hero">
          <div>
            <span className="section-kicker">PHASE 8 · BRAIN REPORT</span>
            <h1>See the pattern behind <span>your play.</span></h1>
            <p>
              One dashboard for your five skill tracks, shared XP, adaptive
              difficulty, personal bests, and recent runs.
            </p>
          </div>

          <div className="report-level-card">
            <div className="report-level-row">
              <span>LEVEL {String(player.level).padStart(2, '0')}</span>
              <DifficultyBadge difficulty={difficulty} />
            </div>
            <div className="report-level-value">{averageMastery}%</div>
            <div className="report-level-label">average mastery</div>
            <div className="report-xp-track">
              <span style={{ width: progress + '%' }} />
            </div>
            <div className="report-xp-row">
              <span>{player.xp} XP</span>
              <span>
                {player.level >= GAME_CONFIG.maxLevel
                  ? 'MAX LEVEL'
                  : xpToNext + ' XP to next level'}
              </span>
            </div>
          </div>
        </section>

        <section className="report-summary-grid" aria-label="Report summary">
          <article className="report-summary-card">
            <span className="report-summary-icon">◈</span>
            <strong>{totalRuns}</strong>
            <span>Total completed runs</span>
          </article>
          <article className="report-summary-card">
            <span className="report-summary-icon">↗</span>
            <strong>{player.xp}</strong>
            <span>Shared brain XP</span>
          </article>
          <article className="report-summary-card">
            <span className="report-summary-icon">{highestSkill.icon}</span>
            <strong>{getSkillMastery(player, highestSkill.key)}%</strong>
            <span>Highest current mastery · {highestSkill.label}</span>
          </article>
          <article className="report-summary-card">
            <span className="report-summary-icon">{lowestSkill.icon}</span>
            <strong>{getSkillMastery(player, lowestSkill.key)}%</strong>
            <span>Lowest current mastery · {lowestSkill.label}</span>
          </article>
        </section>

        <section className="report-section">
          <div className="report-section-heading">
            <div>
              <span className="section-kicker">SKILL MATRIX</span>
              <h2>Five skills. <span>One profile.</span></h2>
            </div>
            <p>
              Mastery is updated after each completed test and is used to tune
              the challenge level for that skill.
            </p>
          </div>

          <div className="report-skill-grid">
            {SKILLS.map((skill) => {
              const mastery = getSkillMastery(player, skill.key);
              return (
                <article className="report-skill-card" key={skill.key}>
                  <div className="report-skill-top">
                    <div className="report-skill-title">
                      <span className="report-skill-icon">{skill.icon}</span>
                      <div>
                        <strong>{skill.label}</strong>
                        <small>{skill.description}</small>
                      </div>
                    </div>
                    <b>{mastery}%</b>
                  </div>
                  <div className="report-mastery-track">
                    <span style={{ width: mastery + '%' }} />
                  </div>
                  <div className="report-skill-meta">
                    <span>{getRuns(player, skill.key)} runs</span>
                    <span>Best {getBest(player, skill.key)}</span>
                  </div>
                  <button
                    className="report-play-button"
                    onClick={() => onPlay(skill.action)}
                  >
                    Run {skill.label} <span>→</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="report-section report-history-section">
          <div className="report-section-heading">
            <div>
              <span className="section-kicker">RECENT RUNS</span>
              <h2>Your latest <span>attempts.</span></h2>
            </div>
            <p>
              The report keeps a short local history so the dashboard stays
              useful without requiring an account or server.
            </p>
          </div>

          {history.length > 0 ? (
            <div className="report-history-list">
              {history.slice(0, 12).map((run, index) => (
                <article className="report-history-row" key={run.id || (run.at + '-' + index)}>
                  <span className="report-history-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="report-history-skill">
                    <b>{SKILLS.find((skill) => skill.key === run.type)?.icon || '◈'}</b>
                    <strong>{run.label || run.type}</strong>
                  </span>
                  <span className="report-history-metric">{getHistoryMetric(run)}</span>
                  <span className="report-history-xp">+{run.xp || 0} XP</span>
                  <span className="report-history-date">{formatDate(run.at)}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="report-empty-state">
              <span>◌</span>
              <h3>No completed runs yet.</h3>
              <p>Play any live test and your first entry will appear here.</p>
              <button className="primary-button" onClick={() => onPlay('reaction')}>
                Start first run <span className="button-arrow">→</span>
              </button>
            </div>
          )}
        </section>

        <section className="report-footer-cta">
          <div>
            <span className="section-kicker">NEXT MOVE</span>
            <h2>Turn one report into <span>another run.</span></h2>
            <p>
              Your challenge level keeps adapting as the five mastery tracks
              change.
            </p>
          </div>
          <button className="primary-button" onClick={() => onPlay('reaction')}>
            <span>Run a test</span>
            <span className="button-arrow">→</span>
          </button>
        </section>
      </main>

      <footer className="report-footer">
        <span>YOUR BRAIN IS LYING © 2026</span>
        <span>Phase 8 · Brain Report</span>
      </footer>
    </div>
  );
}

export default BrainReport;
