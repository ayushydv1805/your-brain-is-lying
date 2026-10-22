import { useState } from 'react';
import { getTrainingPlan } from '../game/brainFeatures';
import '../phase-ab.css';

export default function TrainingPlan({ player, onHome, onPlay, onWeekly }) {
  const [minutes, setMinutes] = useState(10);
  const plan = getTrainingPlan(player, minutes);
  const start = (action) => onPlay(action);

  return (
    <div className="phase-page">
      <header className="phase-topbar">
        <button className="ghost-button" onClick={onHome}>← Home</button>
        <span className="phase-brand">🧠 YOUR BRAIN IS LYING</span>
        <span className="phase-status">PHASE B · TRAINING PLAN</span>
      </header>
      <main className="phase-main">
        <section className="phase-hero">
          <span className="phase-kicker">SMALL SESSIONS, CLEAR INTENT</span>
          <h1>Your next session, <span>already mapped out.</span></h1>
          <p>The plan gives extra attention to lower-mastery skills and adds variety. Change the time whenever you need; this is a flexible suggestion, not a requirement.</p>
          <div className="phase-segment" role="group" aria-label="Choose session length">
            {[5, 10, 15].map((value) => <button key={value} type="button" aria-pressed={minutes === value} className={minutes === value ? 'is-selected' : ''} onClick={() => setMinutes(value)}>{value} min</button>)}
          </div>
        </section>

        <section className="phase-section">
          <div className="phase-section-heading"><div><span className="phase-kicker">{plan.title.toUpperCase()}</span><h2>A plan that fits <span>your day.</span></h2></div><p>{plan.description} · {minutes} minutes total</p></div>
          <div className="phase-plan-list">
            {plan.steps.map((step, index) => (
              <article className="phase-plan-step" key={step.key + '-' + index}>
                <div className="phase-plan-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="phase-plan-icon" aria-hidden="true">{step.icon}</div>
                <div className="phase-plan-copy"><span className="phase-kicker">{step.duration} MINUTES · {step.mastery}% MASTERY</span><h3>{step.label}</h3><p>{step.description} {step.rationale}.</p></div>
                <button className="primary-button" onClick={() => start(step.action)}><span>Start</span><span className="button-arrow">→</span></button>
              </article>
            ))}
          </div>
          <div className="phase-inline-actions">
            <button className="ghost-button" onClick={onWeekly}>Review weekly report</button>
            <button className="primary-button" onClick={() => start(plan.steps[0].action)}><span>Start this plan</span><span className="button-arrow">→</span></button>
          </div>
        </section>
        <aside className="phase-note"><strong>Suggested timing, not a stopwatch</strong><p>The listed minutes are intended practice blocks, not a guaranteed session length. A full game may run shorter or longer depending on the mode.</p></aside>
      </main>
    </div>
  );
}
