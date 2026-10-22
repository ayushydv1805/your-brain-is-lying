import { getCoachInsights, getSkillStats } from '../game/brainFeatures';
import '../phase-ab.css';

export default function BrainCoach({ player, onHome, onPlay, onPlan, onWeekly }) {
  const insights = getCoachInsights(player);
  const stats = getSkillStats(player);
  const totalRuns = Number(player?.totalRuns || 0) + Number(player?.totalMemoryRuns || 0) + Number(player?.totalAttentionRuns || 0) + Number(player?.totalLogicRuns || 0) + Number(player?.totalImpulseRuns || 0);
  const handleAction = (action) => {
    if (action === 'plan') onPlan();
    else if (action === 'weekly') onWeekly();
    else onPlay(action);
  };

  return (
    <div className="phase-page">
      <header className="phase-topbar">
        <button className="ghost-button" onClick={onHome}>← Home</button>
        <span className="phase-brand">🧠 YOUR BRAIN IS LYING</span>
        <span className="phase-status">PHASE B · BRAIN COACH</span>
      </header>
      <main className="phase-main">
        <section className="phase-hero">
          <span className="phase-kicker">PERSONAL PRACTICE GUIDE</span>
          <h1>Train with a <span>little more intention.</span></h1>
          <p>Your coach reads the results saved by this app and turns them into practical next steps. It is a transparent, rule-based coach — not a medical tool or a remote AI chat service.</p>
          <div className="phase-stat-row">
            <div><strong>{totalRuns}</strong><span>completed runs</span></div>
            <div><strong>{player?.level || 1}</strong><span>player level</span></div>
            <div><strong>{player?.currentStreak || 0}</strong><span>day streak</span></div>
          </div>
        </section>

        <section className="phase-section">
          <div className="phase-section-heading"><div><span className="phase-kicker">BASED ON YOUR SAVED DATA</span><h2>Your next <span>best moves.</span></h2></div><p>Suggestions update as you complete more games. Early patterns can be noisy, so look across multiple runs.</p></div>
          <div className="phase-card-grid">
            {insights.map((insight) => (
              <article className="phase-card" key={insight.title}>
                <span className="phase-card-icon" aria-hidden="true">{insight.icon}</span>
                <h3>{insight.title}</h3>
                <p>{insight.body}</p>
                <button className="primary-button" onClick={() => handleAction(insight.action)}><span>{insight.button}</span><span className="button-arrow">→</span></button>
              </article>
            ))}
          </div>
        </section>

        <section className="phase-section">
          <div className="phase-section-heading"><div><span className="phase-kicker">FIVE SKILLS</span><h2>Your current <span>snapshot.</span></h2></div><p>Mastery is the game's internal progress score, not a clinical measurement.</p></div>
          <div className="phase-skill-grid">
            {stats.map((skill) => (
              <article className="phase-skill-card" key={skill.key}>
                <div><span>{skill.icon}</span><strong>{skill.label}</strong></div>
                <div className="phase-progress"><i style={{ width: skill.mastery + '%' }} /></div>
                <p>{skill.mastery}% mastery · {skill.runs} saved runs</p>
                <button className="phase-text-button" onClick={() => onPlay(skill.action)}>Practice skill ↗</button>
              </article>
            ))}
          </div>
        </section>
        <aside className="phase-note"><strong>Keep the data in perspective</strong><p>Scores can change with sleep, environment, device speed and familiarity with the game. Treat this coach as a guide for in-app practice, not as evidence of intelligence, attention disorder or any health condition.</p></aside>
      </main>
    </div>
  );
}
