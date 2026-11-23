import { useState, useRef, useEffect } from 'react';
import { SLOTS, POS_LABEL } from '../data/fillers';

interface SlotChipProps {
  slotId: string;
}

export function SlotChip({ slotId }: SlotChipProps) {
  const slot = SLOTS[slotId];
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  if (!slot) {
    return <span className="slot-chip">[{slotId}]</span>;
  }

  return (
    <span
      ref={wrapRef}
      className="slot-chip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="slot-chip"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {slot.label}
      </button>
      {open && (
        <span className="slot-popover" role="tooltip">
          <span className="slot-pos-tag">{POS_LABEL[slot.pos]}</span>
          <div className="slot-filler-en">{slot.filler}</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{slot.fillerZh}</div>
          {slot.hint && <div className="slot-hint">{slot.hint}</div>}
        </span>
      )}
    </span>
  );
}
