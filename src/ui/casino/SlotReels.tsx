import { useEffect, useState } from 'react';
import { SLOT_REEL_COUNT, SLOT_SYMBOLS, type SlotSymbol } from '../../core';
import { SLOT_SYMBOL_GLYPHS, SLOT_TICK_MS, slotStopAt } from './slotSymbols';

interface SlotReelsProps {
  reels: readonly SlotSymbol[] | null;
  spinning: boolean;
}

const BLANK: readonly SlotSymbol[] = Array.from({ length: SLOT_REEL_COUNT }, (_, index) => SLOT_SYMBOLS[index]!);

const passingSymbol = (reel: number, tick: number): SlotSymbol => SLOT_SYMBOLS[(tick * (reel + 2) + reel * 2) % SLOT_SYMBOLS.length]!;

export function SlotReels({ reels, spinning }: SlotReelsProps) {
  const [stopped, setStopped] = useState(SLOT_REEL_COUNT);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!spinning) {
      setStopped(SLOT_REEL_COUNT);
      return;
    }
    setStopped(0);
    const interval = setInterval(() => setTick(value => value + 1), SLOT_TICK_MS);
    const stops = Array.from({ length: SLOT_REEL_COUNT }, (_, reel) => setTimeout(() => setStopped(reel + 1), slotStopAt(reel)));
    return () => {
      clearInterval(interval);
      stops.forEach(clearTimeout);
    };
  }, [spinning]);

  const final = reels ?? BLANK;
  return (
    <div className="slot-reels" aria-live="polite">
      {final.map((symbol, reel) => {
        const turning = spinning && reel >= stopped;
        return (
          <span key={reel} className="slot-reel" data-spinning={turning}>
            {SLOT_SYMBOL_GLYPHS[turning ? passingSymbol(reel, tick) : symbol]}
          </span>
        );
      })}
    </div>
  );
}
