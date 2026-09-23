import { getLevelFromXp, getLevelProgress } from '../game/gameConfig';
import DifficultyBadge from './DifficultyBadge';

export default function GameResult({ result, player, onAgain, onHome }) {
  const level = getLevelFromXp(player.xp);
  const progress = getLevelProgress(player.xp);
  const xpIntoLevel = player.xp % 100;
  const remaining = level >= 10 ? 0 : 100 - xpIntoLevel;

  return (
    <section className="result-screen">
      <div className="result-shell">
        <div className="result-kicker">
          <span className="pulse-dot" />
          RUN COMPLETE
        </div>

        <h1>Your brain<br /><span>responded.</span></h1>
        <p className="result-subtitle">
          Reaction is only the beginning. Your first baseline has been recorded.
        </p>

        <DifficultyBadge profile={result.difficulty} />

        <div className="result-main-card">
          <div className="result-primary">
            <span>AVERAGE REACTION</span>
            <strong>{result.average}<small>ms</small></strong>
            <em className={'rating-' + result.rating.tone}>{result.rating.label}</em>
          </div>

          <div className="result-stats">
            <div>
              <span>BEST</span>
              <strong>{result.best} ms</strong>
            </div>
            <div>
              <span>ROUNDS</span>
              <strong>{result.times.length}/5</strong>
            </div>
            <div>
              <span>RUN XP</span>
              <strong>+{result.xp}</strong>
            </div>
          </div>
        </div>

        <div className="xp-card">
          <div className="xp-header">
            <span>LEVEL {level}</span>
            <b>{player.xp} XP</b>
          </div>
          <div className="xp-track"><i style={{ width: progress + '%' }} /></div>
          <small>
            {level >= 10
              ? 'Maximum planned level reached.'
              : remaining + ' XP until the next level'}
          </small>
        </div>

        <div className="reaction-breakdown">
          {result.times.map((time, index) => (
            <div key={time + '-' + index}>
              <span>ROUND {String(index + 1).padStart(2, '0')}</span>
              <strong>{time} ms</strong>
              <i style={{ width: Math.min(100, Math.max(8, 100 - time / 8)) + '%' }} />
            </div>
          ))}
        </div>

        <div className="result-actions">
          <button className="primary-button" onClick={onAgain}>
            <span>Run it again</span>
            <span className="button-arrow">↻</span>
          </button>
          <button className="ghost-button" onClick={onHome}>Return home</button>
        </div>
      </div>
    </section>
  );
}
