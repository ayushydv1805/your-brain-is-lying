import { useEffect } from 'react';

export default function LevelUpCelebration({
  level,
  previousLevel,
  tier,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="level-up-overlay" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
      <div className="level-up-backdrop" onClick={onClose} />
      <div className="level-up-card">
        <span className="level-up-kicker">
          <i />
          PROGRESSION UPDATE
        </span>

        <div className="level-up-burst" aria-hidden="true">
          <span>LEVEL</span>
          <strong>{String(level).padStart(2, '0')}</strong>
        </div>

        <div className="level-up-copy">
          <h2 id="level-up-title">
            Your brain
            <br />
            <span>just levelled up.</span>
          </h2>

          <p>
            Level {previousLevel} complete. The challenge is now allowed to
            push you harder.
          </p>
        </div>

        <div className="level-up-tier">
          <span>NEW DIFFICULTY TIER</span>
          <strong>{tier.shortName}</strong>
          <small>Levels {tier.levels} · adaptive mode enabled</small>
        </div>

        <button className="primary-button level-up-button" onClick={onClose}>
          <span>Keep going</span>
          <span className="button-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
