import { Fragment } from 'react';
import { ArrowRight } from 'lucide-react';

interface StoryLineProps {
  nodes: string[];
  activeIndex?: number;
  detail?: string;
}

export function StoryLine({ nodes, activeIndex = -1, detail }: StoryLineProps) {
  return (
    <div>
      <div className="storyline">
        {nodes.map((node, idx) => {
          const stateClass =
            idx === activeIndex ? 'active' : activeIndex > idx ? 'passed' : '';
          return (
            <Fragment key={`${node}-${idx}`}>
              {idx > 0 && (
                <ArrowRight
                  size={13}
                  strokeWidth={1.5}
                  style={{ color: 'var(--ink-faint)', flexShrink: 0 }}
                />
              )}
              <span className={`storyline-node ${stateClass}`}>
                <span className="storyline-dot" />
                <span>{node}</span>
              </span>
            </Fragment>
          );
        })}
      </div>
      {detail && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-muted)' }}>
          {detail}
        </div>
      )}
    </div>
  );
}
