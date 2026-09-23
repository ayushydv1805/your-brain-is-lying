import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_CONFIG,
  getAttentionRating,
  getAttentionXp,
} from '../game/gameConfig';
import { createAttentionRound } from '../game/attentionQuestions';

const PHASES = {
  READY: 'ready',
  SEARCH: 'search',
  RESULT: 'result',
};

export default function AttentionTest({ level, difficultyProfile, onFinish, onExit }) {
  const effectiveLevel = difficultyProfile?.effectiveLevel ?? level;
  const tier = difficultyProfile?.tier;
  const [phase, setPhase] = useState(PHASES.READY);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(() => createAttentionRound(effectiveLevel, 1));
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [roundCorrect, setRoundCorrect] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [lastTime, setLastTime] = useState(null);
  const [roundHistory, setRoundHistory] = useState([]);

  const timerRef = useRef(null);
  const searchStartedAtRef = useRef(0);
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

    const nextQuestion = createAttentionRound(effectiveLevel, roundNumber);

    setQuestion(nextQuestion);
    setSelected(null);
    setRoundCorrect(null);
    setTimedOut(false);
    setLastTime(null);
    setPhase(PHASES.SEARCH);

    searchStartedAtRef.current = performance.now();

    timerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;

      clearTimer();
      setTimedOut(true);
      setRoundCorrect(false);
      setSelected(null);
      setLastTime(nextQuestion.timeLimit);
      setPhase(PHASES.RESULT);
    }, nextQuestion.timeLimit);
  }, [clearTimer, effectiveLevel]);

  const startGame = () => {
    finishedRef.current = false;
    setRound(1);
    setScore(0);
    setSelected(null);
    setRoundCorrect(null);
    setTimedOut(false);
    setLastTime(null);
    setRoundHistory([]);
    startRound(1);
  };

  const handleCellClick = (value) => {
    if (phase !== PHASES.SEARCH) return;

    const elapsed = Math.max(
      1,
      Math.round(performance.now() - searchStartedAtRef.current),
    );

    clearTimer();
    setLastTime(elapsed);
    setSelected(value);

    if (value === question.target) {
      setRoundCorrect(true);
      setScore((currentScore) => currentScore + 1);
    } else {
      setRoundCorrect(false);
    }

    setPhase(PHASES.RESULT);
  };

  const finishRun = (finalScore, finalHistory) => {
    if (finishedRef.current) return;

    finishedRef.current = true;

    const completedRounds = finalHistory.length;
    const successfulTimes = finalHistory
      .filter((item) => item.correct)
      .map((item) => item.time);

    const averageTime = successfulTimes.length
      ? Math.round(
          successfulTimes.reduce((sum, value) => sum + value, 0) /
            successfulTimes.length,
        )
      : null;

    const accuracy = Math.round(
      (finalScore / GAME_CONFIG.totalAttentionRounds) * 100,
    );

    onFinish({
      type: 'attention',
      score: finalScore,
      rounds: GAME_CONFIG.totalAttentionRounds,
      accuracy,
      average: averageTime,
      best: successfulTimes.length ? Math.min(...successfulTimes) : null,
      xp: getAttentionXp(finalScore, averageTime, effectiveLevel),
      rating: getAttentionRating(accuracy, averageTime),
      difficulty: difficultyProfile,
      effectiveLevel,
      roundHistory: finalHistory,
      completedRounds,
    });
  };

  const continueRound = () => {
    const currentRound = {
      round,
      target: question.target,
      gridSize: question.gridSize,
      difficulty: question.difficulty,
      timeLimit: question.timeLimit,
      time: lastTime,
      selected,
      correct: roundCorrect === true,
      timedOut,
    };

    const finalHistory = [...roundHistory, currentRound];
    const finalScore = score + (roundCorrect ? 1 : 0);

    setRoundHistory(finalHistory);

    if (round >= GAME_CONFIG.totalAttentionRounds) {
      finishRun(finalScore, finalHistory);
      return;
    }

    const nextRound = round + 1;
    setRound(nextRound);
    startRound(nextRound);
  };

  return (
    <section className="game-screen attention-game-screen">
      <div className="game-topbar">
        <button className="game-back" onClick={onExit}>
          ← Exit
        </button>

        <div className="game-progress">
          <span>ATTENTION TEST · 5 ROUNDS</span>
          <div
            className="progress-dots"
            aria-label={'Round ' + round + ' of ' + GAME_CONFIG.totalAttentionRounds}
          >
            {Array.from(
              { length: GAME_CONFIG.totalAttentionRounds },
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
          <span className="section-kicker">TEST 03 · ATTENTION</span>
          <h1>
            Find it.
            <br />
            <span>Ignore everything else.</span>
          </h1>
          <p>
            One exact code is hidden in a growing field of near-misses.
            Scan fast. Match both characters. Do not trust the first thing you see.
          </p>
        </div>

        <div className="attention-target">
          <span>FIND EXACTLY</span>
          <strong>{question.target}</strong>
          <small>{question.gridSize} × {question.gridSize} field</small>
        </div>

        <div className="attention-arena">
          {phase === PHASES.SEARCH && (
            <div className="attention-timebar" aria-hidden="true">
              <i style={{ '--attention-duration': question.timeLimit + 'ms' }} />
            </div>
          )}

          <div
            className={
              'attention-grid phase-' + phase + (timedOut ? ' is-timeout' : '')
            }
            style={{
              gridTemplateColumns:
                'repeat(' + question.gridSize + ', minmax(0, 1fr))',
            }}
          >
            {question.cells.map((value, index) => {
              const isTarget = value === question.target;
              const isSelected = selected === value && phase === PHASES.RESULT;

              return (
                <button
                  key={value + '-' + index}
                  className={
                    'attention-cell' +
                    (isSelected ? ' is-selected' : '') +
                    (phase === PHASES.RESULT && isTarget ? ' is-answer' : '') +
                    (phase === PHASES.RESULT && isSelected && !isTarget
                      ? ' is-miss'
                      : '')
                  }
                  disabled={phase !== PHASES.SEARCH}
                  onClick={() => handleCellClick(value)}
                  aria-label={'Choose code ' + value}
                >
                  <span>{value[0]}</span>
                  <b>{value[1]}</b>
                </button>
              );
            })}
          </div>

          <div className="attention-meta">
            <div>
              <span>ROUND</span>
              <strong>{round} / {GAME_CONFIG.totalAttentionRounds}</strong>
            </div>
            <div>
              <span>FIELD</span>
              <strong>{question.gridSize} × {question.gridSize}</strong>
            </div>
            <div>
              <span>TIME LIMIT</span>
              <strong>{question.timeLimit}ms</strong>
            </div>
            <div>
              <span>SCORE</span>
              <strong>{score} / {GAME_CONFIG.totalAttentionRounds}</strong>
            </div>
          </div>
        </div>

        <div className="game-instruction" aria-live="polite">
          {phase === PHASES.READY &&
            'Start the five-round search. The target is shown above the grid.'}
          {phase === PHASES.SEARCH &&
            'Find the exact target. Both characters must match.'}
          {phase === PHASES.RESULT &&
            (timedOut
              ? 'Time is up. The correct target is highlighted for the review.'
              : roundCorrect
                ? 'Correct. Your eyes found the signal in the noise.'
                : 'Not quite. You matched the wrong code.')}
        </div>

        <div className="difficulty-note">
          <span>ADAPTIVE ATTENTION</span>
          <b>{tier?.shortName ?? question.difficulty}</b>
          <small>
            {question.gridSize}×{question.gridSize} · {question.timeLimit}ms · Level {level}{effectiveLevel !== level ? ' · adaptive shift' : ''}
          </small>
        </div>

        {phase === PHASES.READY && (
          <button className="primary-button game-next" onClick={startGame}>
            <span>Start attention test</span>
            <span className="button-arrow">→</span>
          </button>
        )}

        {phase === PHASES.RESULT && (
          <button className="primary-button game-next" onClick={continueRound}>
            <span>
              {round >= GAME_CONFIG.totalAttentionRounds
                ? 'See attention report'
                : 'Next round'}
            </span>
            <span className="button-arrow">→</span>
          </button>
        )}
      </div>
    </section>
  );
}
