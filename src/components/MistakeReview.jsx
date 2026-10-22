import { buildMistakeReview } from '../game/brainFeatures';
import '../phase-ab.css';

const SKILL_LABELS = { reaction: 'Reaction', memory: 'Memory', attention: 'Attention', logic: 'Logic', impulse: 'Impulse' };

export default function MistakeReview({ result }) {
  const skill = result?.type;
  const items = buildMistakeReview(result, skill);
  if (!items.length) return null;
  const misses = items.filter((item) => !item.correct);
  const hasReviewableMistakes = skill !== 'reaction' && misses.length > 0;

  return (
    <section className="mistake-review" aria-labelledby="mistake-review-title">
      <div className="mistake-review-heading">
        <span className="phase-kicker">PHASE A · LEARN FROM THIS RUN</span>
        <h2 id="mistake-review-title">{hasReviewableMistakes ? 'A few rounds to revisit.' : 'Your practice takeaway.'}</h2>
        <p>{skill === 'reaction'
          ? 'Reaction rounds are reviewed for consistency rather than right or wrong answers.'
          : hasReviewableMistakes
            ? misses.length + ' round' + (misses.length === 1 ? '' : 's') + ' marked for review, out of ' + items.length + '.'
            : 'No missed rounds were recorded in this result. Use the notes below to reinforce your approach.'}</p>
      </div>
      <div className="mistake-review-list">
        {items.map((item, index) => (
          <article className={'mistake-review-item ' + (item.correct ? 'is-correct' : 'is-review')} key={String(item.round) + '-' + index}>
            <span className="mistake-review-status" aria-label={item.correct ? 'Correct' : 'Review'}>{item.correct ? '✓' : '!'}</span>
            <div><div className="mistake-review-title"><strong>{item.round === 'Summary' ? 'Session summary' : SKILL_LABELS[skill] + ' · Round ' + item.round}</strong><span>{item.title}</span></div><p>{item.detail}</p><small>{item.takeaway}</small></div>
          </article>
        ))}
      </div>
      <p className="phase-footnote">Review is generated from this run's recorded results. It does not infer anything about health or general intelligence.</p>
    </section>
  );
}
