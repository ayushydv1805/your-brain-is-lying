import {
  GAME_CONFIG,
  getLevelProgress,
} from '../game/gameConfig';
import DifficultyBadge from './DifficultyBadge';

export default function MemoryResult({ result, player, onAgain, onHome }) {
  const progress = getLevelProgress(player.xp);
  const roundHistory = result.roundHistory ?? [];

  return (
    <section className="result-screen memory-result-screen">
      <div className="result-shell">
        <div className="result-kicker">
          <span className="pulse-dot" />
          MEMORY RUN COMPLETE
        </div>

        <h1>
          Your recall
          <br />
          <span>was tested.</span>
        </h1>

        <p className="result-subtitle">
          Every sequence was generated fresh. Your score came from exact-order
          recall, not from memorising a fixed quiz.
        </p>

        <DifficultyBadge profile={result.difficulty} />

        <div className="result-main-card">
          <div className="result-primary">
            <span>MEMORY ACCURACY</span>
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
              <span>RUN XP</span>
              <strong>+{result.xp}</strong>
            </div>
            <div>
              <span>BEST SCORE</span>
              <strong>
                {player.bestMemoryScore} / {GAME_CONFIG.totalMemoryRounds}
              </strong>
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
            Memory training adds XP to the same progression system.
          </small>
        </div>

        <div className="memory-result-list">
          <div className="memory-result-header">
            <div>
              <span className="section-kicker">ROUND BREAKDOWN</span>
              <h2>
                Every sequence. <span>Accounted for.</span>
              </h2>
            </div>
            <p>
              {roundHistory.length} / {GAME_CONFIG.totalMemoryRounds} rounds recorded
            </p>
          </div>

          <div className="memory-history">
            {roundHistory.map((item) => (
              <article
                className={
                  'memory-history-row ' +
                  (item.correct ? 'is-correct' : 'is-wrong')
                }
                key={item.round}
              >
                <div className="memory-history-index">
                  <span>0{item.round}</span>
                  <strong>{item.correct ? '✓' : '×'}</strong>
                </div>

                <div className="memory-history-main">
                  <div className="memory-history-top">
                    <strong>
                      {item.correct ? 'Exact recall' : 'Sequence missed'}
                    </strong>
                    <span>
                      {item.length} symbols · {item.difficulty}
                    </span>
                  </div>

                  <div className="memory-history-sequence">
                    <span>SEEN</span>
                    <div>
                      {item.sequence.map((symbol, index) => (
                        <i
                          key={'seen-' + item.round + '-' + index}
                        >
                          {symbol}
                        </i>
                      ))}
                    </div>
                  </div>

                  <div className="memory-history-sequence">
                    <span>YOU</span>
                    <div>
                      {item.recalled.length > 0 ? (
                        item.recalled.map((symbol, index) => (
                          <i
                            className={
                              item.sequence[index] === symbol
                                ? 'match'
                                : 'miss'
                            }
                            key={'recall-' + item.round + '-' + index}
                          >
                            {symbol}
                          </i>
                        ))
                      ) : (
                        <em>No selection</em>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="result-actions">
          <button className="primary-button" onClick={onAgain}>
            <span>Run memory again</span>
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
