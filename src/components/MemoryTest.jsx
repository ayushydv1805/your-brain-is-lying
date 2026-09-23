import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_CONFIG,
  getMemoryRating,
  getMemoryXp,
} from '../game/gameConfig';
import {
  createMemoryRound,
  getMemoryLength,
} from '../game/memoryQuestions';

const PHASES = {
  READY: 'ready',
  MEMORIZE: 'memorize',
  RECALL: 'recall',
  RESULT: 'result',
};

export default function MemoryTest({ level, difficultyProfile, onFinish, onExit }) {
  const effectiveLevel = difficultyProfile?.effectiveLevel ?? level;
  const tier = difficultyProfile?.tier;
  const [phase, setPhase] = useState(PHASES.READY);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(() => createMemoryRound(effectiveLevel, 1));
  const [selected, setSelected] = useState([]);
  const [attempt, setAttempt] = useState([]);
  const [score, setScore] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(null);
  const [roundHistory, setRoundHistory] = useState([]);

  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const finishedRef = useRef(false);

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

  const startRound = useCallback((roundNumber) => {
    clearTimer();

    const nextQuestion = createMemoryRound(effectiveLevel, roundNumber);

    setQuestion(nextQuestion);
    setSelected([]);
    setAttempt([]);
    setRoundCorrect(null);
    setPhase(PHASES.MEMORIZE);

    timerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase(PHASES.RECALL);
    }, nextQuestion.displayTime);
  }, [clearTimer, effectiveLevel]);

  const startGame = () => {
    finishedRef.current = false;
    setRound(1);
    setScore(0);
    setSelected([]);
    setAttempt([]);
    setRoundCorrect(null);
    setRoundHistory([]);
    startRound(1);
  };

  const handleSymbolClick = (symbol) => {
    if (phase !== PHASES.RECALL) return;

    const position = selected.length;
    const expected = question.sequence[position];
    const nextAttempt = [...selected, symbol];

    if (symbol !== expected) {
      clearTimer();
      setAttempt(nextAttempt);
      setRoundCorrect(false);
      setPhase(PHASES.RESULT);
      return;
    }

    setSelected(nextAttempt);

    if (nextAttempt.length === question.sequence.length) {
      clearTimer();
      setAttempt(nextAttempt);
      setScore((value) => value + 1);
      setRoundCorrect(true);
      setPhase(PHASES.RESULT);
    }
  };

  const finishRun = (finalScore, finalHistory) => {
    if (finishedRef.current) return;

    finishedRef.current = true;

    const accuracy = Math.round(
      (finalScore / GAME_CONFIG.totalMemoryRounds) * 100,
    );

    onFinish({
      type: 'memory',
      score: finalScore,
      rounds: GAME_CONFIG.totalMemoryRounds,
      accuracy,
      xp: getMemoryXp(finalScore, level),
      rating: getMemoryRating(accuracy, finalHistory.length),
      difficulty: difficultyProfile,
      effectiveLevel,
      roundHistory: finalHistory,
    });
  };

  const continueRound = () => {
    const currentRound = {
      round,
      length: question.length,
      displayTime: question.displayTime,
      difficulty: question.difficulty,
      correct: roundCorrect === true,
      sequence: [...question.sequence],
      recalled: [...attempt],
    };

    const finalHistory = [...roundHistory, currentRound];
    const finalScore = score + (roundCorrect ? 1 : 0);

    setRoundHistory(finalHistory);

    if (round >= GAME_CONFIG.totalMemoryRounds) {
      finishRun(finalScore, finalHistory);
      return;
    }

    const nextRound = round + 1;
    setRound(nextRound);
    startRound(nextRound);
  };

  const targetLength = getMemoryLength(effectiveLevel, round);
  const visibleScore = score + (roundCorrect ? 1 : 0);

  return (
    <section className="game-screen memory-game-screen">
      <div className="game-topbar">
        <button className="game-back" onClick={onExit}>
          ← Exit
        </button>

        <div className="game-progress">
          <span>MEMORY TEST · 5 ROUNDS</span>
          <div
            className="progress-dots"
            aria-label={'Round ' + round + ' of ' + GAME_CONFIG.totalMemoryRounds}
          >
            {Array.from(
              { length: GAME_CONFIG.totalMemoryRounds },
              (_, index) => (
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
              ),
            )}
          </div>
        </div>

        <div className="game-level">
          LVL {String(level).padStart(2, '0')}
        </div>
      </div>

      <div className="game-content">
        <div className="game-heading">
          <span className="section-kicker">TEST 02 · MEMORY</span>
          <h1>
            See it.
            <br />
            <span>Hold it.</span>
          </h1>
          <p>
            Five rounds. Every round gets harder with a fresh sequence.
            Rebuild each one in exactly the same order.
          </p>
        </div>

        <div className="memory-arena">
          <div className="memory-status">
            <span aria-live="polite">
              {phase === PHASES.READY && 'READY'}
              {phase === PHASES.MEMORIZE && 'MEMORIZE'}
              {phase === PHASES.RECALL && 'RECALL'}
              {phase === PHASES.RESULT &&
                (roundCorrect ? 'ROUND CLEARED' : 'ROUND LOST')}
            </span>
            <b>{question.length} SYMBOLS</b>
          </div>

          <div
            className={'memory-sequence phase-' + phase}
            key={question.id + '-' + phase}
            style={{
              '--memory-duration': question.displayTime + 'ms',
            }}
          >
            {phase === PHASES.MEMORIZE &&
              question.sequence.map((symbol, index) => (
                <span key={symbol + index}>{symbol}</span>
              ))}

            {phase === PHASES.RECALL &&
              question.sequence.map((_, index) => (
                <span
                  className={
                    index < selected.length
                      ? 'memory-slot filled'
                      : 'memory-slot'
                  }
                  key={index}
                >
                  {selected[index] || '·'}
                </span>
              ))}

            {phase === PHASES.READY && <strong>READY?</strong>}

            {phase === PHASES.RESULT && (
              <div className="memory-result-preview">
                <strong>{roundCorrect ? 'NICE RECALL' : 'MEMORY RESET'}</strong>
                <small>
                  {roundCorrect
                    ? 'Exact sequence'
                    : 'One wrong symbol ends the round'}
                </small>
              </div>
            )}
          </div>

          {phase === PHASES.MEMORIZE && (
            <div className="memory-timebar" aria-hidden="true">
              <i />
            </div>
          )}

          <div className="memory-options" aria-label="Memory answer choices">
            {question.options.map((symbol, index) => {
              const isSelected = selected.includes(symbol);

              return (
                <button
                  key={symbol + index}
                  className={
                    isSelected
                      ? 'memory-option selected'
                      : 'memory-option'
                  }
                  onClick={() => handleSymbolClick(symbol)}
                  disabled={phase !== PHASES.RECALL || isSelected}
                  aria-label={'Choose ' + symbol}
                >
                  {symbol}
                </button>
              );
            })}
          </div>

          <div className="memory-meta">
            <div>
              <span>ROUND</span>
              <strong>
                {round} / {GAME_CONFIG.totalMemoryRounds}
              </strong>
            </div>
            <div>
              <span>SEQUENCE LENGTH</span>
              <strong>{targetLength} symbols</strong>
            </div>
            <div>
              <span>RECALLED</span>
              <strong>
                {attempt.length} / {targetLength}
              </strong>
            </div>
            <div>
              <span>SCORE</span>
              <strong>
                {visibleScore} / {GAME_CONFIG.totalMemoryRounds}
              </strong>
            </div>
          </div>
        </div>

        <div className="game-instruction" aria-live="polite">
          {phase === PHASES.READY &&
            'Start the five-round challenge. The first sequence appears immediately.'}
          {phase === PHASES.MEMORIZE &&
            'Memorize the exact order. The countdown bar shows how long you have.'}
          {phase === PHASES.RECALL &&
            'Click the symbols in the exact order you saw them.'}
          {phase === PHASES.RESULT &&
            (roundCorrect
              ? 'Correct. Your recall held under pressure.'
              : 'Wrong order. Study the next fresh sequence and keep going.')}
        </div>

        <div className="difficulty-note">
          <span>ADAPTIVE MEMORY</span>
          <b>{tier?.shortName ?? question.difficulty}</b>
          <small>
            {targetLength} symbols · {question.displayTime}ms · Level {level}
          </small>
        </div>

        {phase === PHASES.READY && (
          <button className="primary-button game-next" onClick={startGame}>
            <span>Start memory test</span>
            <span className="button-arrow">→</span>
          </button>
        )}

        {phase === PHASES.MEMORIZE && (
          <div className="memory-countdown">
            WATCH CLOSELY · THEN RECALL
          </div>
        )}

        {phase === PHASES.RESULT && (
          <button className="primary-button game-next" onClick={continueRound}>
            <span>
              {round >= GAME_CONFIG.totalMemoryRounds
                ? 'See memory report'
                : 'Next round'}
            </span>
            <span className="button-arrow">→</span>
          </button>
        )}
      </div>
    </section>
  );
}
