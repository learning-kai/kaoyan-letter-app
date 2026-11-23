import { Rating, type Grade } from 'ts-fsrs';
import type { IntervalPreview } from '../core/scheduler';

interface GradeBarProps {
  previews: IntervalPreview[];
  suggestedRating: Rating;
  onSelect: (rating: Grade) => void;
}

const CLASS_MAP: Record<Grade, string> = {
  [Rating.Again]: 'grade-again',
  [Rating.Hard]: 'grade-hard',
  [Rating.Good]: 'grade-good',
  [Rating.Easy]: 'grade-easy',
};

const KEY_MAP: Record<Grade, string> = {
  [Rating.Again]: '1',
  [Rating.Hard]: '2',
  [Rating.Good]: '3',
  [Rating.Easy]: '4',
};

export function GradeBar({ previews, suggestedRating, onSelect }: GradeBarProps) {
  return (
    <div className="grade-bar" role="group" aria-label="选择本次复习评分">
      {previews.map((item) => {
        const isSuggested = item.rating === suggestedRating;
        return (
          <button
            key={item.rating}
            type="button"
            className={`grade-btn ${CLASS_MAP[item.rating]} ${isSuggested ? 'suggested' : ''}`}
            onClick={() => onSelect(item.rating)}
          >
            <span>
              {item.label} <span style={{ opacity: 0.55, fontSize: 11 }}>({KEY_MAP[item.rating]})</span>
            </span>
            <small className="tabular-nums">{item.intervalText}</small>
          </button>
        );
      })}
    </div>
  );
}
