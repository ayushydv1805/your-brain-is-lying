export default function MemoryResult({ result, player, onAgain, onHome }) {
  const progress = Math.min(100, player.xp % 100);

  return (
    <section className="result-screen">
      <div className="result-shell">
        <div className="result-kicker">
          <span className="pulse-dot" />
          MEMORY RUN COMPLETE
        </div>

        <h1>Your recall<br /><span>was tested.</span></h1>
        <p className="result-subtitle">
          Every sequence was generated fresh. Your score came from recall, not a fixed quiz.
        </p>

        <div className="result-main-card">
          <div className="result-primary">
            <span>MEMORY ACCURACY</span>
            <strong>{result.accuracy}<small>%</small></strong>
            <em className={'rating-' + result.rating.tone}>{result.rating.label}</em>
          </div>

          <div className="result-stats">
            <div>
              <span>CORRECT</span>
              <strong>{result.score} / {result.rounds}</strong>
            </div>
            <div>
              <span>RUN XP</span>
              <strong>+{result.xp}</strong>
            </div>
            <div>
              <span>BEST SCORE</span>
              <strong>{player.bestMemoryScore} / 5</strong>
            </div>
          </div>
        </div>

        <div className="xp-card">
          <div className="xp-header">
            <span>LEVEL {player.level}</span>
            <b>{player.xp} XP</b>
          </div>
          <div className="xp-track"><i style={{ width: progress + '%' }} /></div>
          <small>Memory training adds XP to the same progression system.</small>
        </div>

        <div className="result-actions">
          <button className="primary-button" onClick={onAgain}>
            <span>Run memory again</span>
            <span className="button-arrow">↻</span>
          </button>
          <button className="ghost-button" onClick={onHome}>Return home</button>
        </div>
      </div>
    </section>
  );
}
