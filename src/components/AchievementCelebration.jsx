import { useEffect } from 'react';

export default function AchievementCelebration({ achievement, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!achievement) return null;

  return (
    <div
      className="achievement-unlock-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-unlock-title"
    >
      <div className="achievement-unlock-backdrop" onClick={onClose} />
      <div className="achievement-unlock-card">
        <span className="achievement-unlock-kicker">
          <i /> ACHIEVEMENT UNLOCKED
        </span>

        <div className="achievement-unlock-icon" aria-hidden="true">
          {achievement.icon}
        </div>

        <h2 id="achievement-unlock-title">{achievement.title}</h2>
        <p>{achievement.description}</p>

        <div className="achievement-unlock-requirement">
          <span>MILESTONE</span>
          <strong>{achievement.requirement}</strong>
        </div>

        <button
          className="primary-button achievement-unlock-button"
          onClick={onClose}
        >
          <span>Keep going</span>
          <span className="button-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
