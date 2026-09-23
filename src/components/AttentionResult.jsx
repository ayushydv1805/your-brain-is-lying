import {
  GAME_CONFIG,
  getLevelProgress,
} from '../game/gameConfig';

export default function AttentionResult({ result, player, onAgain, onHome }) {
  const progress = getLevelProgress(player.xp);
  const history = result.roundHistory ?? [];
  const averageLabel =
    result.average === null || result.average === undefined
      ? '—'
      : result.average + ' ms';

  return (
    <section className="result-screen attention-result-screen">
      <div className="result-shell">
        <div className="result-kicker">
          <span className="pulse-dot" />
          ATTENTION RUN COMPLETE
        </div>

        <h1>
          The noise
          <br />
          <span>got measured.</span>
        </h1>

        <p className="result-subtitle">
          You searched a fresh field every round. Accuracy came first; speed
          showed how efficiently you found the exact signal.
        </p>

        <div className="result-main-card">
          <div className="result-primary">
            <span>ATTENTION ACCURACY</span>
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
              <span>CORRECT</span>
              <strong>
                {result.score} / {result.rounds}
              </strong>
            </div>
            <div>
              <span>AVG SEARCH</span>
              <strong>{averageLabel}</strong>
            </div>
            <div>
              <span>RUN XP</span>
              <strong>+{result.xp}</strong>
            </div>
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
            Attention training adds XP to the same progression system.
          </small>
        </div>

        <div className="attention-result-list">
          <div className="attention-result-header">
            <div>
              <span className="section-kicker">ROUND BREAKDOWN</span>
              <h2>
                Five searches. <span>One record.</span>
              </h2>
            </div>
            <p>
              {history.length} / {GAME_CONFIG.totalAttentionRounds} rounds recorded
            </p>
          </div>

          <div className="attention-history">
            {history.map((item) => (
              <article
                className={
                  'attention-history-row ' +
                  (item.correct ? 'is-correct' : 'is-wrong')
                }
                key={item.round}
              >
                <div className="attention-history-index">
                  <span>0{item.round}</span>
                  <strong>{item.correct ? '✓' : '×'}</strong>
                </div>

                <div className="attention-history-main">
                  <div className="attention-history-top">
                    <strong>
                      {item.correct
                        ? 'Target found'
                        : item.timedOut
                          ? 'Timed out'
                          : 'Wrong target'}
                    </strong>
                    <span>
                      {item.gridSize}×{item.gridSize} · {item.difficulty}
                    </span>
                  </div>

                  <div className="attention-history-code">
                    <span>TARGET</span>
                    <strong>{item.target}</strong>
                    <span>YOU CLICKED</span>
                    <strong className={item.correct ? 'match' : 'miss'}>
                      {item.selected ?? 'TIME'}
                    </strong>
                    <span>TIME</span>
                    <strong>
                      {item.time === null ? '—' : item.time + ' ms'}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="result-actions">
          <button className="primary-button" onClick={onAgain}>
            <span>Run attention again</span>
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
