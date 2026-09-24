import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_CONFIG,
  getImpulseDifficulty,
  getImpulseRating,
  getImpulseXp,
} from '../game/gameConfig';
import { createImpulseRound } from '../game/impulseQuestions';
import DifficultyBadge from './DifficultyBadge';

const PHASES = {
  READY: 'ready',
  ACTIVE: 'active',
  FEEDBACK: 'feedback',
  ROUND_RESULT: 'round-result',
};

function emptyRoundStats() {
  return {
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctNoGo: 0,
    totalTrials: 0,
    reactionTimes: [],
  };
}

function emptyRunStats() {
  return {
    totalTrials: 0,
    correctDecisions: 0,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctNoGo: 0,
    reactionTimes: [],
  };
}

export default function ImpulseTest({
  level,
  difficultyProfile,
  onFinish,
  onExit,
}) {
  const effectiveLevel = difficultyProfile?.effectiveLevel ?? level;
  const tier = difficultyProfile?.tier;

  const [phase, setPhase] = useState(PHASES.READY);
  const [round, setRound] = useState(1);
  const [trialIndex, setTrialIndex] = useState(0);
  const [question, setQuestion] = useState(() =>
    createImpulseRound(effectiveLevel, 1),
  );
  const [remainingMs, setRemainingMs] = useState(0);
  const [lastOutcome, setLastOutcome] = useState(null);
  const [roundSummary, setRoundSummary] = useState(emptyRoundStats);
  const [roundHistory, setRoundHistory] = useState([]);

  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const transitionRef = useRef(null);
  const trialStartedAtRef = useRef(0);
  const mountedRef = useRef(true);
  const runStatsRef = useRef(emptyRunStats());
  const roundStatsRef = useRef(emptyRoundStats());
  const finishedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    if (transitionRef.current) window.clearTimeout(transitionRef.current);
    timerRef.current = null;
    countdownRef.current = null;
    transitionRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  const startRound = useCallback(
    (roundNumber) => {
      clearTimers();
      const nextQuestion = createImpulseRound(
        effectiveLevel,
        roundNumber,
      );
      roundStatsRef.current = emptyRoundStats();
      setQuestion(nextQuestion);
      setRound(roundNumber);
      setTrialIndex(0);
      setRemainingMs(0);
      setLastOutcome(null);
      setRoundSummary(emptyRoundStats());
      setPhase(PHASES.ACTIVE);
    },
    [clearTimers, effectiveLevel],
  );

  const startGame = () => {
    finishedRef.current = false;
    runStatsRef.current = emptyRunStats();
    setRoundHistory([]);
    startRound(1);
  };

  const resolveTrial = useCallback(
    (clicked) => {
      if (!mountedRef.current || phase !== PHASES.ACTIVE) return;

      const trial = question.trials[trialIndex];
      if (!trial) return;

      clearTimers();

      const elapsed = Math.max(
        1,
        Math.round(performance.now() - trialStartedAtRef.current),
      );
      const roundStats = roundStatsRef.current;
      const runStats = runStatsRef.current;

      runStats.totalTrials += 1;
      roundStats.totalTrials += 1;

      let outcome = 'correct-no-go';
      let correctDecision = true;

      if (trial.match) {
        if (clicked) {
          roundStats.hits += 1;
          runStats.hits += 1;
          roundStats.reactionTimes.push(elapsed);
          runStats.reactionTimes.push(elapsed);
          outcome = 'hit';
        } else {
          roundStats.misses += 1;
          runStats.misses += 1;
          outcome = 'miss';
          correctDecision = false;
        }
      } else if (clicked) {
        roundStats.falseAlarms += 1;
        runStats.falseAlarms += 1;
        outcome = 'false-alarm';
        correctDecision = false;
      } else {
        roundStats.correctNoGo += 1;
        runStats.correctNoGo += 1;
      }

      if (correctDecision) {
        runStats.correctDecisions += 1;
      }

      setLastOutcome({
        type: outcome,
        time: trial.match && clicked ? elapsed : null,
      });

      const isLastTrial = trialIndex >= question.trials.length - 1;

      if (isLastTrial) {
        const summary = {
          ...roundStats,
          reactionTimes: [...roundStats.reactionTimes],
        };
        summary.average = summary.reactionTimes.length
          ? Math.round(
              summary.reactionTimes.reduce(
                (sum, value) => sum + value,
                0,
              ) / summary.reactionTimes.length,
            )
          : null;
        setRoundSummary(summary);
        setPhase(PHASES.ROUND_RESULT);
        return;
      }

      setPhase(PHASES.FEEDBACK);
      transitionRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setTrialIndex((value) => value + 1);
        setPhase(PHASES.ACTIVE);
      }, 140);
    },
    [clearTimers, phase, question, trialIndex],
  );

  useEffect(() => {
    if (phase !== PHASES.ACTIVE) return undefined;

    const trial = question.trials[trialIndex];
    if (!trial) return undefined;

    trialStartedAtRef.current = performance.now();
    setRemainingMs(trial.duration);

    countdownRef.current = window.setInterval(() => {
      const elapsed = performance.now() - trialStartedAtRef.current;
      setRemainingMs(Math.max(0, Math.round(trial.duration - elapsed)));
    }, 50);

    timerRef.current = window.setTimeout(() => {
      resolveTrial(false);
    }, trial.duration);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
      timerRef.current = null;
      countdownRef.current = null;
    };
  }, [phase, question, trialIndex, resolveTrial]);

  const currentTrial = question.trials[trialIndex];
  const progress = currentTrial
    ? Math.min(
        100,
        ((trialIndex + (phase === PHASES.ROUND_RESULT ? 1 : 0)) /
          question.trials.length) *
          100,
      )
    : 100;

  const continueRound = () => {
    const currentSummary = {
      round,
      trials: question.trials.length,
      hits: roundSummary.hits,
      misses: roundSummary.misses,
      falseAlarms: roundSummary.falseAlarms,
      correctNoGo: roundSummary.correctNoGo,
      average: roundSummary.average,
      accuracy: Math.round(
        ((roundSummary.hits + roundSummary.correctNoGo) /
          Math.max(1, question.trials.length)) *
          100,
      ),
      rounds: GAME_CONFIG.totalImpulseRounds,
    };

    const nextHistory = [...roundHistory, currentSummary];
    setRoundHistory(nextHistory);

    if (round >= GAME_CONFIG.totalImpulseRounds) {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const stats = runStatsRef.current;
      const average = stats.reactionTimes.length
        ? Math.round(
            stats.reactionTimes.reduce((sum, value) => sum + value, 0) /
              stats.reactionTimes.length,
          )
        : null;
      const totalTrials = stats.totalTrials;
      const accuracy = Math.round(
        (stats.correctDecisions / Math.max(1, totalTrials)) * 100,
      );
      const falseAlarmRate = Math.round(
        (stats.falseAlarms / Math.max(1, totalTrials)) * 100,
      );

      onFinish({
        type: 'impulse',
        score: stats.correctDecisions,
        totalTrials,
        accuracy,
        falseAlarmRate,
        hits: stats.hits,
        misses: stats.misses,
        falseAlarms: stats.falseAlarms,
        correctNoGo: stats.correctNoGo,
        average,
        best: stats.reactionTimes.length
          ? Math.min(...stats.reactionTimes)
          : null,
        xp: getImpulseXp(
          stats.correctDecisions,
          totalTrials,
          accuracy,
          average,
          effectiveLevel,
        ),
        rating: getImpulseRating(
          accuracy,
          falseAlarmRate,
          average,
        ),
        difficulty: difficultyProfile,
        effectiveLevel,
        roundHistory: nextHistory,
      });
      return;
    }

    startRound(round + 1);
  };

  return (
    <section className="game-screen impulse-game-screen">
      <div className="game-topbar">
        <button className="game-back" onClick={onExit}>
          ← Exit
        </button>
        <div className="game-progress">
          <span>
            IMPULSE TEST · {GAME_CONFIG.totalImpulseRounds} ROUNDS
          </span>
          <div className="progress-dots">
            {Array.from(
              { length: GAME_CONFIG.totalImpulseRounds },
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
          <span className="section-kicker">
            TEST 05 · IMPULSE CONTROL
          </span>
          <h1>
            Don&apos;t click.
            <br />
            <span>Unless you should.</span>
          </h1>
          <p>
            A fresh signal appears repeatedly. Click only when it exactly
            matches the target. Your fastest mistake is still a mistake.
          </p>
        </div>

        <div className="impulse-rule-card">
          <div>
            <span>MATCH THIS EXACT SIGNAL</span>
            <small>
              {question.targetLabel} · ignore {question.distractor}
            </small>
          </div>
          <strong>{question.target}</strong>
        </div>

        <div className="impulse-arena">
          <div className="impulse-arena-top">
            <span>
              ROUND {String(round).padStart(2, '0')} · SIGNAL{' '}
              {Math.min(trialIndex + 1, question.trials.length)}/
              {question.trials.length}
            </span>
            <b>
              {phase === PHASES.ACTIVE
                ? (remainingMs / 1000).toFixed(2) + 's'
                : phase === PHASES.ROUND_RESULT
                  ? 'ROUND DONE'
                  : '—'}
            </b>
          </div>

          <div className="impulse-progress">
            <i style={{ width: progress + '%' }} />
          </div>

          <button
            className={
              'impulse-stimulus ' +
              (phase === PHASES.ACTIVE ? 'is-active' : 'is-feedback')
            }
            onClick={() => resolveTrial(true)}
            disabled={phase !== PHASES.ACTIVE}
            aria-label="Impulse response area"
          >
            <span className="impulse-stimulus-label">SIGNAL</span>
            <strong>{currentTrial?.symbol ?? '—'}</strong>
            <small>
              {phase === PHASES.ACTIVE
                ? 'CLICK ONLY IF IT MATCHES'
                : lastOutcome?.type === 'hit'
                  ? 'HIT'
                  : lastOutcome?.type === 'false-alarm'
                    ? 'FALSE ALARM'
                    : lastOutcome?.type === 'miss'
                      ? 'MISSED'
                      : 'HELD'}
            </small>
          </button>

          {phase === PHASES.FEEDBACK && (
            <div
              className={
                'impulse-feedback ' +
                (lastOutcome?.type === 'false-alarm' ||
                lastOutcome?.type === 'miss'
                  ? 'is-wrong'
                  : 'is-right')
              }
            >
              <strong>
                {lastOutcome?.type === 'hit'
                  ? 'Good response.'
                  : lastOutcome?.type === 'false-alarm'
                    ? 'You clicked a no-go.'
                    : 'You let a go signal pass.'}
              </strong>
              <span>
                {lastOutcome?.time
                  ? lastOutcome.time + ' ms'
                  : 'Next signal incoming'}
              </span>
            </div>
          )}

          {phase === PHASES.ROUND_RESULT && (
            <div className="impulse-round-result">
              <div>
                <span>ROUND ACCURACY</span>
                <strong>
                  {Math.round(
                    ((roundSummary.hits + roundSummary.correctNoGo) /
                      Math.max(1, question.trials.length)) *
                      100,
                  )}
                  %
                </strong>
              </div>
              <div>
                <span>HITS</span>
                <strong>{roundSummary.hits}</strong>
              </div>
              <div>
                <span>FALSE ALARMS</span>
                <strong>{roundSummary.falseAlarms}</strong>
              </div>
              <div>
                <span>AVG REACTION</span>
                <strong>
                  {roundSummary.average === null
                    ? '—'
                    : roundSummary.average + ' ms'}
                </strong>
              </div>
              <button className="primary-button" onClick={continueRound}>
                <span>
                  {round >= GAME_CONFIG.totalImpulseRounds
                    ? 'See impulse report'
                    : 'Next round'}
                </span>
                <span className="button-arrow">→</span>
              </button>
            </div>
          )}
        </div>

        <div className="difficulty-note">
          <span>ADAPTIVE IMPULSE</span>
          <b>{tier?.shortName ?? 'ADAPTIVE'}</b>
          <small>
            {question.trials.length} signals · {question.interval}ms base interval
            · Level {level}
            {effectiveLevel !== level ? ' · adaptive shift' : ''}
          </small>
        </div>

        {phase === PHASES.READY && (
          <button className="primary-button game-next" onClick={startGame}>
            <span>Start impulse test</span>
            <span className="button-arrow">→</span>
          </button>
        )}
      </div>
    </section>
  );
}
