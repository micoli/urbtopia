import { useEffect, useRef } from 'react';
import { singleOrDoubleClick } from './singleOrDoubleClick';

export function useSingleOrDoubleClick(onSingle: () => void, onDouble: (() => void) | undefined): () => void {
  const latest = useRef({ onSingle, onDouble });
  latest.current = { onSingle, onDouble };
  const handler = useRef<ReturnType<typeof singleOrDoubleClick> | null>(null);
  if (!handler.current) handler.current = singleOrDoubleClick(() => latest.current.onSingle(), latest.current.onDouble ? () => latest.current.onDouble?.() : undefined);
  useEffect(() => () => handler.current?.dispose(), []);
  return () => (latest.current.onDouble ? handler.current!.click() : latest.current.onSingle());
}
