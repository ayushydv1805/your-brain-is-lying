import { getLevelProgress } from '../game/gameConfig';
import DifficultyBadge from './DifficultyBadge';

export default function ImpulseResult({
  result,
  player,
  onAgain,
  onHome,
}) {
  const progress = getLevelProgress(player.xp);
  const history = result.roundHistory ?? [];
  const averageLabel =
    result.average == null ? '—' : result.average + ' ms';

  return (
    <section className="result-screen impulse-result-screen">
      <div className="result-shell">
        <div className="result-kicker">
          <span className="pulse-dot" />
          IMPULSE RUN COMPLETE
        </div>

        <h1>
          You knew the rule.
          <br />
          <span>Did you obey it?</span>
        </h1>

        <p className="result-subtitle">
          Control accuracy counts both correct hits and correct restraint.
          Misses and false alarms are shown separately so the pattern is easy to read.
        </p>

        <DifficultyBadge profile={result.difficulty} />

        <div className="result-main-card">
          <div className="result-primary">
            <span>CONTROL ACCURACY</span>
            <strong>
              {result.accuracy}
              <small>%</small>
            </strong>
            <em className={'rating-' + result.rating.tone}>
              {result.rating.label}
            </em>
          </div>

          <div className="result-stats">
            <div>
              <span>CORRECT DECISIONS</span>
              <strong>
                {result.score}/{result.totalTrials}
              </strong>
            </div>
            <div>
              <span>FALSE ALARMS</span>
              <strong>{result.falseAlarms}</strong>
            </div>
            <div>
              <span>AVG HIT REACTION</span>
              <strong>{averageLabel}</strong>
            </div>
          </div>
        </div>

        <div className="impulse-metrics">
          <div>
            <span>HITS</span>
            <strong>{result.hits}</strong>
            <small>correct go signals</small>
          </div>
          <div>
            <span>NO-GO HELD</span>
            <strong>{result.correctNoGo}</strong>
            <small>correct restraint</small>
          </div>
          <div>
            <span>MISSES</span>
            <strong>{result.misses}</strong>
            <small>go signals ignored</small>
          </div>
          <div>
            <span>FALSE ALARM RATE</span>
            <strong>{result.falseAlarmRate}%</strong>
            <small>unwanted clicks</small>
          </div>
        </div>

        <div className="xp-card">
          <div className="xp-header">
            <span>LEVEL {player.level}</span>
            <b>{player.xp} XP</b>
          </div>
          <div className="xp-track">
            <i style={{ width: progress + '%' }} />
          </div>
          <small>
            Impulse control feeds the shared XP and adaptive mastery system.
          </small>
        </div>

        <div className="impulse-result-list">
          <div className="impulse-result-header">
            <div>
              <span className="section-kicker">ROUND BREAKDOWN</span>
              <h2>
                Five rounds. <span>One control pattern.</span>
              </h2>
            </div>
            <p>
              {history.length} / {history[0]?.rounds ?? GAME_CONFIG.totalImpulseRounds} rounds recorded
            </p>
          </div>

          <div className="impulse-history">
            {history.map((item) => (
              <article className="impulse-history-row" key={item.round}>
                <div className="impulse-history-index">
                  <span>0{item.round}</span>
                  <strong>{item.accuracy}%</strong>
                </div>
                <div className="impulse-history-main">
                  <div className="impulse-history-top">
                    <strong>Round {item.round}</strong>
                    <span>
                      {item.trials} signals ·{' '}
                      {item.average == null ? '—' : item.average + ' ms'}
                    </span>
                  </div>
                  <div className="impulse-history-grid">
                    <div>
                      <span>HITS</span>
                      <strong>{item.hits}</strong>
                    </div>
                    <div>
                      <span>NO-GO</span>
                      <strong>{item.correctNoGo}</strong>
                    </div>
                    <div>
                      <span>MISSES</span>
                      <strong>{item.misses}</strong>
                    </div>
                    <div>
                      <span>FALSE</span>
                      <strong>{item.falseAlarms}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="result-actions">
          <button className="primary-button" onClick={onAgain}>
            <span>Run impulse again</span>
            <span className="button-arrow">↻</span>
          </button>
          <button className="ghost-button" onClick={onHome}>
            Return home
          </button>
        </div>
      </div>
    </section>
  );
}
