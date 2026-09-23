export default function DifficultyBadge({ profile, compact = false }) {
  if (!profile?.tier) return null;

  return (
    <div className={'difficulty-badge ' + (compact ? 'compact' : '')}>
      <span className="difficulty-badge-dot" />
      <div>
        <small>ADAPTIVE DIFFICULTY</small>
        <strong>{profile.tier.shortName}</strong>
      </div>
      {!compact && (
        <em>
          Challenge level {profile.effectiveLevel}
          {profile.adaptive ? ' · adjusted to mastery' : ''}
        </em>
      )}
    </div>
  );
}
