import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_CONFIG,
  getReactionDifficulty,
  getReactionRating,
  getReactionXp,
} from '../game/gameConfig';

const PHASES = {
  READY: 'ready',
  WAITING: 'waiting',
  GO: 'go',
  RESULT: 'result',
  FINISHED: 'finished',
};

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function ReactionTest({
  level,
  difficultyProfile,
  onFinish,
  onExit,
}) {
  const effectiveLevel = difficultyProfile?.effectiveLevel ?? level;
  const tier = difficultyProfile?.tier;
  const [phase, setPhase] = useState(PHASES.READY);
  const [round, setRound] = useState(1);
  const [times, setTimes] = useState([]);
  const [lastTime, setLastTime] = useState(null);
  const [falseStart, setFalseStart] = useState(false);

  const timerRef = useRef(null);
  const goAtRef = useRef(0);
  const mountedRef = useRef(true);

  const difficulty = getReactionDifficulty(effectiveLevel);

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

  const beginRound = useCallback(() => {
    clearTimer();
    setFalseStart(false);
    setLastTime(null);
    setPhase(PHASES.WAITING);

    const delay = randomDelay(difficulty.minDelay, difficulty.maxDelay);

    timerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      goAtRef.current = performance.now();
      setPhase(PHASES.GO);
    }, delay);
  }, [clearTimer, difficulty.minDelay, difficulty.maxDelay]);

  const startGame = () => {
    setRound(1);
    setTimes([]);
    setLastTime(null);
    setFalseStart(false);
    beginRound();
  };

  const buildRunResult = () => {
    const average = Math.round(
      times.reduce((sum, value) => sum + value, 0) / times.length,
    );

    return {
      type: 'reaction',
      average,
      best: Math.min(...times),
      times,
      xp: getReactionXp(average, times.length),
      rating: getReactionRating(average),
      difficulty: difficultyProfile,
    };
  };

  const handlePadClick = () => {
    if (phase === PHASES.READY) {
      startGame();
      return;
    }

    if (phase === PHASES.WAITING) {
      clearTimer();
      setFalseStart(true);
      setPhase(PHASES.RESULT);
      return;
    }

    if (phase !== PHASES.GO) return;

    const reaction = Math.max(
      1,
      Math.round(performance.now() - goAtRef.current),
    );
    const nextTimes = [...times, reaction];

    clearTimer();
    setLastTime(reaction);
    setTimes(nextTimes);

    if (nextTimes.length >= GAME_CONFIG.totalReactionRounds) {
      setPhase(PHASES.FINISHED);
      return;
    }

    setPhase(PHASES.RESULT);
  };

  const continueRound = () => {
    setRound((value) => value + 1);
    beginRound();
  };

  const currentAverage = times.length
    ? Math.round(
        times.reduce((sum, value) => sum + value, 0) / times.length,
      )
    : null;

  return (
    <section className="game-screen">
      <div className="game-topbar">
        <button className="game-back" onClick={onExit}>
          ← Exit
        </button>

        <div className="game-progress">
          <span>REACTION TEST · 5 ROUNDS</span>
          <div className="progress-dots">
            {Array.from(
              { length: GAME_CONFIG.totalReactionRounds },
              (_, index) => (
                <i
                  key={index}
                  className={
                    index < times.length
                      ? 'done'
                      : index === round - 1 && phase !== PHASES.FINISHED
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
          <span className="section-kicker">TEST 01 · REACTION</span>
          <h1>
            Don&apos;t think.
            <br />
            <span>React.</span>
          </h1>
          <p>
            Wait for the signal. The moment it turns green, hit the pad.
            Your brain will try to predict it. Don&apos;t let it.
          </p>
        </div>

        <div className="reaction-arena">
          <button
            className={[
              'reaction-pad',
              'reaction-pad-' + phase,
              falseStart ? 'false-start' : '',
            ].join(' ')}
            onClick={handlePadClick}
            aria-label="Reaction test pad"
          >
            <span className="pad-ring ring-one" />
            <span className="pad-ring ring-two" />

            {phase === PHASES.READY && (
              <>
                <strong>START</strong>
                <small>5 rounds · {tier?.shortName ?? 'adaptive'}</small>
              </>
            )}

            {phase === PHASES.WAITING && (
              <>
                <strong>WAIT</strong>
                <small>Don&apos;t click yet</small>
              </>
            )}

            {phase === PHASES.GO && (
              <>
                <strong>NOW</strong>
                <small>CLICK!</small>
              </>
            )}

            {phase === PHASES.RESULT && (
              <>
                {falseStart ? (
                  <>
                    <strong>TOO SOON</strong>
                    <small>Wait for green</small>
                  </>
                ) : (
                  <>
                    <strong>{lastTime} ms</strong>
                    <small>{getReactionRating(lastTime).label}</small>
                  </>
                )}
              </>
            )}

            {phase === PHASES.FINISHED && (
              <>
                <strong>{currentAverage} ms</strong>
                <small>Run complete</small>
              </>
            )}
          </button>

          <div className="arena-meta">
            <div>
              <span>ROUND</span>
              <strong>
                {Math.min(round, GAME_CONFIG.totalReactionRounds)} /{' '}
                {GAME_CONFIG.totalReactionRounds}
              </strong>
            </div>
            <div>
              <span>BEST THIS RUN</span>
              <strong>
                {times.length ? Math.min(...times) + ' ms' : '—'}
              </strong>
            </div>
            <div>
              <span>DIFFICULTY</span>
              <strong>{tier?.shortName ?? 'ADAPTIVE'}</strong>
            </div>
          </div>
        </div>

        <div className="game-instruction" aria-live="polite">
          {phase === PHASES.READY &&
            'Your first click starts the test.'}
          {phase === PHASES.WAITING &&
            'Stay still. The signal can appear at any moment.'}
          {phase === PHASES.GO && 'GO — hit it now.'}
          {phase === PHASES.RESULT &&
            (falseStart
              ? 'You anticipated the signal. That is exactly what this test is designed to catch.'
              : 'Good. Reset your focus for the next round.')}
          {phase === PHASES.FINISHED &&
            'Five rounds complete. Review your run before you leave.'}
        </div>

        <div className="difficulty-note">
          <span>ADAPTIVE TIMING</span>
          <b>{tier?.shortName ?? 'ADAPTIVE'}</b>
          <small>
            Level {level} · challenge level {effectiveLevel} ·{' '}
            {difficulty.minDelay}–{difficulty.maxDelay} ms
          </small>
        </div>

        {phase === PHASES.RESULT && (
          <button className="primary-button game-next" onClick={continueRound}>
            <span>Next round</span>
            <span className="button-arrow">→</span>
          </button>
        )}

        {phase === PHASES.FINISHED && (
          <button
            className="primary-button game-next"
            onClick={() => onFinish(buildRunResult())}
          >
            <span>See brain report</span>
            <span className="button-arrow">→</span>
          </button>
        )}
      </div>
    </section>
  );
}
