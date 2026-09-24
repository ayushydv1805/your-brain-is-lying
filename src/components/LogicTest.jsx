import { useEffect, useState } from 'react';
import { GAME_CONFIG, getLogicDifficulty, getLogicRating, getLogicXp } from '../game/gameConfig';
import { createLogicRound } from '../game/logicQuestions';
import DifficultyBadge from './DifficultyBadge';

const PHASES = { QUESTION: 'question', FEEDBACK: 'feedback' };

export default function LogicTest({ level, difficultyProfile, onFinish, onExit }) {
  const effectiveLevel = difficultyProfile?.effectiveLevel ?? level;
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(() => createLogicRound(effectiveLevel, 1));
  const [phase, setPhase] = useState(PHASES.QUESTION);
  const [selected, setSelected] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const timeLimit = getLogicDifficulty(effectiveLevel, round).timeLimit;
  const progress = Math.min(100, (elapsed / timeLimit) * 100);

  useEffect(() => {
    setQuestion(createLogicRound(effectiveLevel, round));
    setSelected(null);
    setElapsed(0);
    setPhase(PHASES.QUESTION);
    setStartedAt(performance.now());
  }, [effectiveLevel, round]);

  useEffect(() => {
    if (phase !== PHASES.QUESTION) return undefined;
    const timer = window.setInterval(() => {
      const nextElapsed = performance.now() - startedAt;
      setElapsed(nextElapsed);
      if (nextElapsed >= timeLimit) {
        window.clearInterval(timer);
        setHistory((current) => current.concat({
          round, type: question.type, label: question.label, question: question.question,
          sequence: question.sequence, selected: null, correct: false, timedOut: true,
          answer: question.correct, explanation: question.explanation, time: null,
        }));
        setSelected('TIME');
        setPhase(PHASES.FEEDBACK);
      }
    }, 40);
    return () => window.clearInterval(timer);
  }, [phase, question, round, startedAt, timeLimit]);

  const submitAnswer = (option) => {
    if (phase !== PHASES.QUESTION) return;
    const solveTime = Math.min(timeLimit, Math.max(1, Math.round(performance.now() - startedAt)));
    const correct = option === question.correct;
    setElapsed(solveTime);
    setSelected(option);
    setHistory((current) => current.concat({
      round, type: question.type, label: question.label, question: question.question,
      sequence: question.sequence, selected: option, correct, timedOut: false,
      answer: question.correct, explanation: question.explanation, time: solveTime,
    }));
    setPhase(PHASES.FEEDBACK);
  };

  const continueRound = () => {
    const isLast = round >= GAME_CONFIG.totalLogicRounds;
    if (isLast) {
      const score = history.filter((item) => item.correct).length;
      const validTimes = history.filter((item) => item.correct && Number.isFinite(item.time)).map((item) => item.time);
      const average = validTimes.length ? Math.round(validTimes.reduce((sum, value) => sum + value, 0) / validTimes.length) : null;
      const accuracy = Math.round((score / GAME_CONFIG.totalLogicRounds) * 100);
      onFinish({
        type: 'logic', score, rounds: GAME_CONFIG.totalLogicRounds, accuracy, average,
        rating: getLogicRating(accuracy, average), xp: getLogicXp(score, average, effectiveLevel),
        roundHistory: history, difficulty: { ...difficultyProfile, skill: 'logic' },
      });
      return;
    }
    setRound((value) => value + 1);
  };

  return (
    <section className="game-screen logic-game-screen">
      <div className="game-nav">
        <button className="game-exit" onClick={onExit}>← Exit</button>
        <div className="game-progress">LOGIC · {round} / {GAME_CONFIG.totalLogicRounds}</div>
        <div className="game-level">LEVEL {String(effectiveLevel).padStart(2, '0')}</div>
      </div>
      <div className="game-content">
        <div className="game-kicker"><span className="pulse-dot" />LOGIC TEST</div>
        <h1>Beat the pattern.<br /><span>Ignore the impulse.</span></h1>
        <p className="game-subtitle">Five fresh logic problems. You have 60 seconds each round — accuracy first, then speed.</p>
        <DifficultyBadge profile={difficultyProfile} />

        <div className="logic-arena">
          <div className="logic-timebar"><i style={{ width: Math.max(0, 100 - progress) + '%' }} /></div>
          <div className="logic-meta"><span>ROUND {String(round).padStart(2, '0')}</span><strong>{Math.max(0, ((timeLimit - elapsed) / 1000)).toFixed(1)}s</strong></div>
          <div className="logic-question-card">
            <div className="logic-type">{question.label}</div>
            <h2>{question.question}</h2>
            {question.sequence && <div className="logic-sequence">{question.sequence}</div>}
            <div className="logic-options">
              {question.options.map((option, index) => {
                const isSelected = selected === option;
                const isCorrect = selected !== null && option === question.correct;
                const isWrong = selected !== null && isSelected && option !== question.correct;
                return (
                  <button key={option + '-' + index} className={'logic-option' + (isCorrect ? ' is-correct' : '') + (isWrong ? ' is-wrong' : '')} onClick={() => submitAnswer(option)} disabled={phase !== PHASES.QUESTION}>
                    <span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong>
                  </button>
                );
              })}
            </div>
          </div>

          {phase === PHASES.FEEDBACK && (
            <div className={'logic-feedback ' + (selected === question.correct ? 'is-correct' : 'is-wrong')}>
              <div><strong>{selected === question.correct ? 'Correct.' : selected === 'TIME' ? 'Time.' : 'Not this time.'}</strong><span>{selected === question.correct ? Math.round(elapsed) + ' ms' : 'Answer: ' + question.correct}</span></div>
              <p>{question.explanation}</p>
              <button className="primary-button" onClick={continueRound}><span>{round >= GAME_CONFIG.totalLogicRounds ? 'See brain report' : 'Next problem'}</span><span className="button-arrow">→</span></button>
            </div>
          )}
        </div>

        <div className="logic-hint-row"><span>FAST ≠ RANDOM</span><i /><span>READ THE RULE</span><i /><span>THEN COMMIT</span></div>
      </div>
    </section>
  );
}
