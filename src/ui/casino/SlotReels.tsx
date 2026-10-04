import { SLOT_REEL_COUNT, SLOT_SYMBOLS, type SlotSymbol } from '../../core';
import { SLOT_SYMBOL_GLYPHS } from './slotSymbols';

interface SlotReelsProps {
  reels: readonly SlotSymbol[] | null;
  spinning: boolean;
}

const BLANK: readonly SlotSymbol[] = Array.from({ length: SLOT_REEL_COUNT }, (_, index) => SLOT_SYMBOLS[index]!);

export function SlotReels({ reels, spinning }: SlotReelsProps) {
  const shown = reels ?? BLANK;
  return (
    <div className="slot-reels" data-spinning={spinning} aria-live="polite">
      {shown.map((symbol, index) => (
        <span key={index} className="slot-reel" style={{ animationDelay: `${index * 120}ms` }}>
          {SLOT_SYMBOL_GLYPHS[symbol]}
        </span>
      ))}
    </div>
  );
}
