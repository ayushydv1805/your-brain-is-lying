import { GAME_CONFIG, getLevelProgress } from '../game/gameConfig';
import DifficultyBadge from './DifficultyBadge';

export default function LogicResult({ result, player, onAgain, onHome }) {
  const progress = getLevelProgress(player.xp);
  const history = result.roundHistory ?? [];
  const averageLabel = result.average === null || result.average === undefined ? '—' : result.average + ' ms';
  return (
    <section className="result-screen logic-result-screen">
      <div className="result-shell">
        <div className="result-kicker"><span className="pulse-dot" />LOGIC RUN COMPLETE</div>
        <h1>The pattern<br /><span>was not enough.</span></h1>
        <p className="result-subtitle">Fresh problems, limited time, and a report that shows where your reasoning held up.</p>
        <DifficultyBadge profile={result.difficulty} />
        <div className="result-main-card">
          <div className="result-primary"><span>LOGIC ACCURACY</span><strong>{result.accuracy}<small>%</small></strong><em className={'rating-' + result.rating.tone}>{result.rating.label}</em></div>
          <div className="result-stats"><div><span>CORRECT</span><strong>{result.score} / {result.rounds}</strong></div><div><span>AVG SOLVE</span><strong>{averageLabel}</strong></div><div><span>RUN XP</span><strong>+{result.xp}</strong></div></div>
        </div>
        <div className="xp-card"><div className="xp-header"><span>LEVEL {player.level}</span><b>{player.xp} XP</b></div><div className="xp-track"><i style={{ width: progress + '%' }} /></div><small>Logic training feeds the shared XP progression.</small></div>
        <div className="logic-result-list">
          <div className="logic-result-header"><div><span className="section-kicker">ROUND BREAKDOWN</span><h2>Five decisions. <span>No fixed answers.</span></h2></div><p>{history.length} / {GAME_CONFIG.totalLogicRounds} rounds recorded</p></div>
          <div className="logic-history">
            {history.map((item) => (
              <article className={'logic-history-row ' + (item.correct ? 'is-correct' : 'is-wrong')} key={item.round}>
                <div className="logic-history-index"><span>0{item.round}</span><strong>{item.correct ? '✓' : '×'}</strong></div>
                <div className="logic-history-main">
                  <div className="logic-history-top"><strong>{item.label}</strong><span>{item.time === null ? 'TIMEOUT' : item.time + ' ms'}</span></div>
                  <p>{item.question}</p>
                  {item.sequence && <div className="logic-history-sequence">{item.sequence}</div>}
                  <div className="logic-history-answer"><span>YOUR ANSWER</span><strong className={item.correct ? 'match' : 'miss'}>{item.selected ?? '—'}</strong><span>KEY</span><strong>{item.answer}</strong></div>
                  <small>{item.explanation}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="result-actions"><button className="primary-button" onClick={onAgain}><span>Run logic again</span><span className="button-arrow">↻</span></button><button className="ghost-button" onClick={onHome}>Return home</button></div>
      </div>
    </section>
  );
}
