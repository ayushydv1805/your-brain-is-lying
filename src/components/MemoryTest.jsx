import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_CONFIG, getMemoryRating, getMemoryXp } from '../game/gameConfig';
import { createMemoryRound, getMemoryLength } from '../game/memoryQuestions';

const PHASES = {
  READY: 'ready',
  MEMORIZE: 'memorize',
  RECALL: 'recall',
  RESULT: 'result',
};

export default function MemoryTest({ level, onFinish, onExit }) {
  const [phase, setPhase] = useState(PHASES.READY);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(() => createMemoryRound(level));
  const [selected, setSelected] = useState([]);
  const [score, setScore] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(null);

  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  const startRound = useCallback(() => {
    clearTimer();
    const nextQuestion = createMemoryRound(level);

    setQuestion(nextQuestion);
    setSelected([]);
    setRoundCorrect(null);
    setPhase(PHASES.MEMORIZE);

    timerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase(PHASES.RECALL);
    }, nextQuestion.displayTime);
  }, [clearTimer, level]);

  const startGame = () => {
    setRound(1);
    setScore(0);
    setSelected([]);
    setRoundCorrect(null);
    startRound();
  };

  const handleSymbolClick = (symbol) => {
    if (phase !== PHASES.RECALL) return;

    const position = selected.length;
    const expected = question.sequence[position];

    if (symbol !== expected) {
      clearTimer();
      setRoundCorrect(false);
      setPhase(PHASES.RESULT);
      return;
    }

    const nextSelected = [...selected, symbol];
    setSelected(nextSelected);

    if (nextSelected.length === question.sequence.length) {
      clearTimer();
      setScore((value) => value + 1);
      setRoundCorrect(true);
      setPhase(PHASES.RESULT);
    }
  };

  const finishRun = (finalScore) => {
    const accuracy = Math.round(
      (finalScore / GAME_CONFIG.totalMemoryRounds) * 100,
    );

    onFinish({
      type: 'memory',
      score: finalScore,
      rounds: GAME_CONFIG.totalMemoryRounds,
      accuracy,
      xp: getMemoryXp(finalScore, level),
      rating: getMemoryRating(accuracy, GAME_CONFIG.totalMemoryRounds),
    });
  };

  const continueRound = () => {
    const finalScore = score + (roundCorrect ? 1 : 0);

    if (round >= GAME_CONFIG.totalMemoryRounds) {
      finishRun(finalScore);
      return;
    }

    setRound((value) => value + 1);
    startRound();
  };

  const targetLength = getMemoryLength(level);

  return (
    <section className="game-screen memory-game-screen">
      <div className="game-topbar">
        <button className="game-back" onClick={onExit}>← Exit</button>

        <div className="game-progress">
          <span>MEMORY TEST</span>
          <div className="progress-dots">
            {Array.from({ length: GAME_CONFIG.totalMemoryRounds }, (_, index) => (
              <i
                key={index}
                className={
                  index < round - 1
                    ? 'done'
                    : index === round - 1
                      ? 'active'
                      : ''
                }
              />
            ))}
          </div>
        </div>

        <div className="game-level">LVL {String(level).padStart(2, '0')}</div>
      </div>

      <div className="game-content">
        <div className="game-heading">
          <span className="section-kicker">TEST 02 · MEMORY</span>
          <h1>See it.<br /><span>Hold it.</span></h1>
          <p>
            A sequence appears for a moment. Then it disappears.
            Rebuild it in exactly the same order.
          </p>
        </div>

        <div className="memory-arena">
          <div className="memory-status">
            <span>
              {phase === PHASES.READY && 'READY'}
              {phase === PHASES.MEMORIZE && 'MEMORIZE'}
              {phase === PHASES.RECALL && 'RECALL'}
              {phase === PHASES.RESULT && (roundCorrect ? 'CORRECT' : 'NOT QUITE')}
            </span>
            <b>SEQUENCE {question.length}</b>
          </div>

          <div className="memory-sequence">
            {phase === PHASES.MEMORIZE && question.sequence.map((symbol, index) => (
              <span key={symbol + index}>{symbol}</span>
            ))}

            {phase === PHASES.RECALL && question.sequence.map((_, index) => (
              <span
                className={index < selected.length ? 'memory-slot filled' : 'memory-slot'}
                key={index}
              >
                {selected[index] || '·'}
              </span>
            ))}

            {phase === PHASES.READY && <strong>READY?</strong>}
            {phase === PHASES.RESULT && (
              <strong>{roundCorrect ? 'NICE RECALL' : 'MEMORY RESET'}</strong>
            )}
          </div>

          <div className="memory-options">
            {question.options.map((symbol, index) => (
              <button
                key={symbol + index}
                className={selected.includes(symbol) ? 'memory-option selected' : 'memory-option'}
                onClick={() => handleSymbolClick(symbol)}
                disabled={phase !== PHASES.RECALL || selected.includes(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>

          <div className="memory-meta">
            <div>
              <span>ROUND</span>
              <strong>{round} / {GAME_CONFIG.totalMemoryRounds}</strong>
            </div>
            <div>
              <span>SEQUENCE</span>
              <strong>{targetLength} symbols</strong>
            </div>
            <div>
              <span>RECALLED</span>
              <strong>{selected.length} / {targetLength}</strong>
            </div>
            <div>
              <span>SCORE</span>
              <strong>{score} / {GAME_CONFIG.totalMemoryRounds}</strong>
            </div>
          </div>
        </div>

        <div className="game-instruction">
          {phase === PHASES.READY && 'Your first click starts the memory challenge.'}
          {phase === PHASES.MEMORIZE && 'Memorize the exact order. The sequence will disappear.'}
          {phase === PHASES.RECALL && 'Click the symbols in the exact order you saw them.'}
          {phase === PHASES.RESULT && (
            roundCorrect
              ? 'Correct. Your recall held under pressure.'
              : 'Wrong order. This round is over, but the next sequence will be different.'
          )}
        </div>

        <div className="difficulty-note">
          <span>ADAPTIVE MEMORY</span>
          <b>{targetLength} symbols</b>
          <small>Level {level} · fresh sequence every round</small>
        </div>

        {phase === PHASES.READY && (
          <button className="primary-button game-next" onClick={startGame}>
            <span>Start memory test</span>
            <span className="button-arrow">→</span>
          </button>
        )}

        {phase === PHASES.MEMORIZE && (
          <div className="memory-countdown">WATCH CLOSELY · THEN RECALL</div>
        )}

        {phase === PHASES.RESULT && (
          <button className="primary-button game-next" onClick={continueRound}>
            <span>{round >= GAME_CONFIG.totalMemoryRounds ? 'See memory report' : 'Next round'}</span>
            <span className="button-arrow">→</span>
          </button>
        )}
      </div>
    </section>
  );
}
