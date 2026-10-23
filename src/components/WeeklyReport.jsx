import { getWeeklySummary } from '../game/brainFeatures';
import { downloadTextFile } from '../game/downloads.js';
import '../phase-ab.css';

function formatRange(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' – ' + end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function WeeklyReport({ player, onHome, onPlan, onPlay }) {
  const summary = getWeeklySummary(player);
  const exportReport = () => {
    const body = {
      app: 'Your Brain Is Lying',
      reportType: 'weekly-practice-summary',
      generatedAt: summary.generatedAt,
      period: formatRange(summary.rangeStart, summary.rangeEnd),
      completedRuns: summary.totalRuns,
      previousPeriodRuns: summary.previousRuns,
      earnedXp: summary.xpEarned,
      previousPeriodXp: summary.previousXp,
      activeDays: summary.activeDays,
      averageAccuracy: summary.averageAccuracy,
      previousAverageAccuracy: summary.previousAverageAccuracy,
      skillBreakdown: summary.bySkill.map(({ label, runs, xp }) => ({ label, runs, xp })),
      dailyActivity: summary.days.map(({ dateLabel, runs, xp }) => ({ date: dateLabel, runs, xp })),
    };
    downloadTextFile('your-brain-is-lying-weekly-report.json', JSON.stringify(body, null, 2), 'application/json;charset=utf-8');
  };
  const hasData = summary.totalRuns > 0 || summary.previousRuns > 0;

  return (
    <div className="phase-page">
      <header className="phase-topbar">
        <button className="ghost-button" onClick={onHome}>← Home</button>
        <span className="phase-brand">🧠 YOUR BRAIN IS LYING</span>
        <span className="phase-status">PHASE B · WEEKLY REPORT</span>
      </header>
      <main className="phase-main">
        <section className="phase-hero">
          <span className="phase-kicker">YOUR LAST SEVEN DAYS</span>
          <h1>Progress you can <span>actually review.</span></h1>
          <p>{formatRange(summary.rangeStart, summary.rangeEnd)} · A summary of sessions saved on this device or in the current profile.</p>
          <div className="phase-stat-row">
            <div><strong>{summary.totalRuns}</strong><span>completed runs</span></div>
            <div><strong>+{summary.xpEarned}</strong><span>XP earned</span></div>
            <div><strong>{summary.activeDays}/7</strong><span>active days</span></div>
          </div>
        </section>

        <section className="phase-section">
          <div className="phase-section-heading"><div><span className="phase-kicker">DAILY ACTIVITY</span><h2>Your week at <span>a glance.</span></h2></div><p>Empty days are simply days without a saved completed run.</p></div>
          <div className="phase-week-grid">
            {summary.days.map((day) => (
              <article className={'phase-week-day ' + (day.runs ? 'is-active' : '')} key={day.key}>
                <span>{day.label}</span><strong>{day.runs}</strong><small>{day.runs === 1 ? 'run' : 'runs'}</small><i style={{ height: Math.max(4, Math.min(48, day.runs * 12)) + 'px' }} /><em>{day.dateLabel}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="phase-section">
          <div className="phase-section-heading"><div><span className="phase-kicker">WEEK-OVER-WEEK</span><h2>Compare the <span>trend.</span></h2></div><p>Compares the latest seven days with the seven days before them. There is not enough data for a comparison until both periods contain measurable results.</p></div>
          <div className="phase-metric-grid">
            <article className="phase-metric-card"><span>RUNS VS PREVIOUS WEEK</span><strong>{summary.runChange > 0 ? '+' : ''}{summary.runChange}</strong><small>{summary.previousRuns} runs in previous period</small></article>
            <article className="phase-metric-card"><span>ACCURACY CHANGE</span><strong>{summary.accuracyChange === null ? '—' : (summary.accuracyChange > 0 ? '+' : '') + summary.accuracyChange + ' pp'}</strong><small>{summary.averageAccuracy === null ? 'Accuracy not recorded in this period' : 'This week average: ' + summary.averageAccuracy + '%'}</small></article>
            <article className="phase-metric-card"><span>XP VS PREVIOUS WEEK</span><strong>{summary.xpEarned - summary.previousXp > 0 ? '+' : ''}{summary.xpEarned - summary.previousXp}</strong><small>{summary.previousXp} XP in previous period</small></article>
            <article className="phase-metric-card"><span>MOST-PRACTISED SKILL</span><strong>{summary.bestFocus}</strong><small>By completed runs this week</small></article>
          </div>
          <div className="phase-skill-grid">
            {summary.bySkill.map((skill) => (
              <article className="phase-skill-card" key={skill.key}>
                <div><span>{skill.icon}</span><strong>{skill.label}</strong></div>
                <div className="phase-progress"><i style={{ width: (summary.totalRuns ? skill.runs / summary.totalRuns * 100 : 0) + '%' }} /></div>
                <p>{skill.runs} runs · {skill.xp} XP</p>
                <button className="phase-text-button" onClick={() => onPlay(skill.action)}>Practice {skill.label.toLowerCase()} ↗</button>
              </article>
            ))}
          </div>
        </section>

        {!hasData && <aside className="phase-note"><strong>Your first week starts with one test.</strong><p>Complete any skill once to begin building this report. Your totals will update automatically as the app saves completed runs.</p></aside>}
        <div className="phase-inline-actions">
          <button className="ghost-button" onClick={onPlan}>Build a training plan</button>
          <button className="ghost-button" onClick={exportReport}>Export weekly report</button>
          <button className="primary-button" onClick={() => onPlay('reaction')}><span>Start a test</span><span className="button-arrow">→</span></button>
        </div>
        <p className="phase-footnote">This report describes in-app practice only. It is not a medical or intelligence assessment.</p>
      </main>
    </div>
  );
}
