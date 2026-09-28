import { getDailyChallenge, isDailyChallengeCompleted } from '../game/dailyChallenge';
import '../daily.css';

function formatDate(date) {
  return date.toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getRecentDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
}

export default function DailyChallenge({
  player,
  onPlay,
  onHome,
  onReport,
  onAchievements,
}) {
  const challenge = getDailyChallenge();
  const completed = isDailyChallengeCompleted(player);
  const recentDays = getRecentDays();

  return (
    <div className="daily-page">
      <div className="daily-backdrop" aria-hidden="true" />

      <header className="daily-topbar">
        <button className="brand" onClick={onHome}>
          <span className="brand-mark">🧠</span>
          <span>
            <strong>Your Brain</strong>
            <small>is lying.</small>
          </span>
        </button>

        <div className="daily-topbar-center">
          <span className="daily-live-dot" />
          <span>PHASE 10 · DAILY CHALLENGE</span>
        </div>

        <div className="daily-topbar-actions">
          <button className="ghost-button" onClick={onReport}>Brain report</button>
          <button className="ghost-button" onClick={onAchievements}>Achievements</button>
        </div>
      </header>

      <main className="daily-main">
        <section className="daily-hero">
          <div className="daily-hero-copy">
            <span className="section-kicker">TODAY · {challenge.dateKey}</span>
            <h1>One run. <span>One daily mission.</span></h1>
            <p>
              The mission rotates by local calendar day, so the same calendar date always
              maps to the same skill without needing an account or remote service.
            </p>
          </div>

          <div className={'daily-focus-card ' + (completed ? 'is-complete' : '')}>
            <div className="daily-focus-top">
              <span className="daily-focus-icon">{challenge.icon}</span>
              <span className="daily-focus-status">
                {completed ? 'COMPLETED TODAY' : 'READY TO PLAY'}
              </span>
            </div>

            <strong>{challenge.label}</strong>
            <h2>{challenge.title}</h2>
            <p>{challenge.detail}</p>

            <div className="daily-reward">
              <div>
                <span>DAILY REWARD</span>
                <strong>+{challenge.bonusXp} XP</strong>
              </div>
              <div>
                <span>COMPLETED</span>
                <strong>{player.completedDailyChallenges || 0}</strong>
              </div>
            </div>

            <button className="primary-button daily-start-button" onClick={() => onPlay(challenge.key)}>
              <span>{completed ? 'Replay today’s skill' : 'Start today’s challenge'}</span>
              <span className="button-arrow">→</span>
            </button>

            <small className="daily-note">
              Replay is always allowed; the +{challenge.bonusXp} XP daily bonus is awarded once per calendar day.
            </small>
          </div>
        </section>

        <section className="daily-week-section">
          <div className="daily-section-heading">
            <div>
              <span className="section-kicker">LAST 7 DAYS</span>
              <h2>Your daily <span>signal.</span></h2>
            </div>
            <p>Green marks mean the assigned daily mission was completed on that local date.</p>
          </div>

          <div className="daily-week-grid">
            {recentDays.map((date) => {
              const item = getDailyChallenge(date);
              const dayKey = item.dateKey;
              const done = Array.isArray(player.dailyChallengeDates)
                && player.dailyChallengeDates.includes(dayKey);

              return (
                <article className={'daily-day-card ' + (done ? 'is-done' : '')} key={dayKey}>
                  <span>{formatDate(date)}</span>
                  <strong>{item.icon}</strong>
                  <b>{item.label}</b>
                  <small>{done ? 'Complete' : 'Open'}</small>
                  <i />
                </article>
              );
            })}
          </div>
        </section>

        <section className="daily-info-grid">
          <article>
            <span className="daily-info-icon">↻</span>
            <h3>Same day, same mission</h3>
            <p>The skill is chosen deterministically from the local date, not randomly on refresh.</p>
          </article>
          <article>
            <span className="daily-info-icon">＋</span>
            <h3>Bonus stacks on normal XP</h3>
            <p>Your standard run XP stays untouched. Daily completion adds the extra reward once.</p>
          </article>
          <article>
            <span className="daily-info-icon">⌁</span>
            <h3>Still fully local</h3>
            <p>Daily completion lives in the same local player profile as mastery, streaks, and achievements.</p>
          </article>
        </section>

        <section className="daily-cta">
          <div>
            <span className="section-kicker">KEEP THE SIGNAL</span>
            <h2>Tomorrow brings a <span>new skill.</span></h2>
            <p>Complete another daily mission and keep building your existing day streak.</p>
          </div>
          <button className="primary-button" onClick={onHome}>
            <span>Back to home</span>
            <span className="button-arrow">→</span>
          </button>
        </section>

        <footer className="daily-footer">
          <span>YOUR BRAIN IS LYING © 2026</span>
          <span>Phase 10 · Daily Brain Challenge</span>
        </footer>
      </main>
    </div>
  );
}
