import { Fragment } from 'react';
import { SlotChip } from './SlotChip';

interface RichSentenceProps {
  text: string;
  resultWord?: string;
  highlightResultWord?: boolean;
}

function renderWithResultHighlight(chunk: string, resultWord?: string, keyPrefix = '') {
  if (!resultWord) return chunk;
  const idx = chunk.indexOf(resultWord);
  if (idx === -1) return chunk;
  return (
    <Fragment key={keyPrefix}>
      {chunk.slice(0, idx)}
      <span className="result-word-highlight">{resultWord}</span>
      {chunk.slice(idx + resultWord.length)}
    </Fragment>
  );
}

export function RichSentence({
  text,
  resultWord,
  highlightResultWord = false,
}: RichSentenceProps) {
  const parts = text.split(/(\{\{\w+\}\})/g);

  return (
    <>
      {parts.map((part, idx) => {
        const match = part.match(/^\{\{(\w+)\}\}$/);
        if (match) {
          return <SlotChip key={`slot-${idx}`} slotId={match[1]} />;
        }
        const lines = part.split('\n');
        return (
          <Fragment key={`txt-${idx}`}>
            {lines.map((line, lineIdx) => (
              <Fragment key={`line-${lineIdx}`}>
                {lineIdx > 0 && <br />}
                {highlightResultWord
                  ? renderWithResultHighlight(line, resultWord, `${idx}-${lineIdx}`)
                  : line}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}
