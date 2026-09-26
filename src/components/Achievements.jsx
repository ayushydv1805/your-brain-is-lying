import { useMemo, useState } from 'react';
import {
  ACHIEVEMENTS,
  getAchievementProgress,
  getAchievementStats,
  isAchievementUnlocked,
} from '../game/achievementEngine';

const FILTERS = [
  ['all', 'All'],
  ['unlocked', 'Unlocked'],
  ['locked', 'Locked'],
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function getLastDays(count, activeDates) {
  const days = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = formatDateKey(date);
    days.push({
      key,
      label: date.toLocaleDateString([], { weekday: 'short' }).slice(0, 2),
      day: date.getDate(),
      active: activeDates.includes(key),
    });
  }
  return days;
}

function getAchievementAction(id) {
  if (id.includes('reaction')) return 'reaction';
  if (id.includes('memory')) return 'memory';
  if (id.includes('attention')) return 'attention';
  if (id.includes('logic')) return 'logic';
  if (id.includes('impulse')) return 'impulse';
  return 'reaction';
}

export default function Achievements({ player, onPlay, onHome, onReport }) {
  const [filter, setFilter] = useState('all');
  const stats = getAchievementStats(player);
  const activityDates = Array.isArray(player.activityDates)
    ? player.activityDates
    : [];
  const streakDays = getLastDays(14, activityDates);

  const visibleAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((achievement) => {
      const unlocked = isAchievementUnlocked(player, achievement.id);
      if (filter === 'unlocked') return unlocked;
      if (filter === 'locked') return !unlocked;
      return true;
    });
  }, [filter, player]);

  const recentUnlocked = ACHIEVEMENTS.filter((achievement) =>
    isAchievementUnlocked(player, achievement.id),
  );

  return (
    <div className="achievements-page">
      <div className="achievements-backdrop" aria-hidden="true" />

      <header className="achievements-topbar">
        <button className="brand" onClick={onHome}>
          <span className="brand-mark">🧠</span>
          <span>
            <strong>Your Brain</strong>
            <small>is lying.</small>
          </span>
        </button>

        <div className="achievements-topbar-actions">
          <button className="ghost-button achievements-nav-button" onClick={onReport}>
            Brain report
          </button>
          <span className="achievements-status">
            <i /> ACHIEVEMENT TRACKER
          </span>
        </div>
      </header>

      <main className="achievements-main">
        <section className="achievements-hero">
          <div>
            <span className="section-kicker">
              PHASE 9 · ACHIEVEMENTS &amp; STREAKS
            </span>
            <h1>Make progress <span>visible.</span></h1>
            <p>
              Every completed run now builds more than XP. Streaks reward
              consistency, while achievements mark milestones across the five
              cognitive skills.
            </p>
          </div>

          <div className="achievement-score-card">
            <div className="achievement-score-top">
              <span>ACHIEVEMENTS</span>
              <strong>{stats.unlocked}/{stats.total}</strong>
            </div>
            <div className="achievement-progress-track">
              <span style={{ width: stats.progress + '%' }} />
            </div>
            <div className="achievement-score-meta">
              <span>{stats.progress}% unlocked</span>
              <span>Level {String(player.level).padStart(2, '0')}</span>
            </div>
          </div>
        </section>

        <section className="streak-panel">
          <div className="streak-copy">
            <span className="section-kicker">CONSISTENCY SIGNAL</span>
            <div className="streak-value-row">
              <strong>{player.currentStreak || 0}</strong>
              <span>day streak</span>
            </div>
            <p>
              Best streak: <b>{player.bestStreak || 0} days</b>. Complete at least
              one test per day to keep the signal alive.
            </p>
          </div>

          <div className="streak-calendar" aria-label="Recent activity">
            {streakDays.map((day) => (
              <div
                className={'streak-day ' + (day.active ? 'is-active' : '')}
                key={day.key}
              >
                <span>{day.label}</span>
                <strong>{day.day}</strong>
                <i />
              </div>
            ))}
          </div>
        </section>

        <section className="achievement-toolbar">
          <div>
            <span className="section-kicker">MILESTONE GRID</span>
            <h2>Your milestones. <span>Your record.</span></h2>
          </div>
          <div className="achievement-filters">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? 'is-active' : ''}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="achievement-grid">
          {visibleAchievements.map((achievement) => {
            const unlocked = isAchievementUnlocked(player, achievement.id);
            const progress = Math.min(
              achievement.target,
              getAchievementProgress(player, achievement),
            );
            const percent =
              achievement.target > 0
                ? Math.round((progress / achievement.target) * 100)
                : 0;

            return (
              <article
                className={'achievement-card ' + (unlocked ? 'is-unlocked' : 'is-locked')}
                key={achievement.id}
              >
                <div className="achievement-card-top">
                  <div className="achievement-icon">
                    {unlocked ? achievement.icon : '◌'}
                  </div>
                  <span className="achievement-state">
                    {unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>

                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>

                <div className="achievement-requirement">
                  <span>{achievement.requirement}</span>
                  <b>
                    {achievement.kind === 'mastery'
                      ? Math.round(progress) + '%'
                      : progress + '/' + achievement.target}
                  </b>
                </div>

                <div className="achievement-progress-track">
                  <span style={{ width: percent + '%' }} />
                </div>
              </article>
            );
          })}
        </section>

        {recentUnlocked.length > 0 && (
          <section className="achievement-recents">
            <div>
              <span className="section-kicker">UNLOCKED COLLECTION</span>
              <h2>Keep the <span>momentum.</span></h2>
            </div>

            <div className="achievement-recents-list">
              {recentUnlocked.slice(-4).reverse().map((achievement) => (
                <button
                  className="achievement-mini"
                  key={achievement.id}
                  onClick={() => onPlay(getAchievementAction(achievement.id))}
                >
                  <span>{achievement.icon}</span>
                  <strong>{achievement.title}</strong>
                  <small>Run another test →</small>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="achievements-footer-cta">
          <div>
            <span className="section-kicker">NEXT RUN</span>
            <h2>One more run can change the <span>record.</span></h2>
            <p>
              Your streak, mastery, XP, and achievement progress all update
              from the same local player profile.
            </p>
          </div>
          <button className="primary-button" onClick={() => onPlay('reaction')}>
            <span>Start a test</span>
            <span className="button-arrow">→</span>
          </button>
        </section>
      </main>

      <footer className="achievements-footer">
        <span>YOUR BRAIN IS LYING © 2026</span>
        <span>Phase 9 · Achievements &amp; Streaks</span>
      </footer>
    </div>
  );
}
