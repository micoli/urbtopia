const collectors = new WeakMap<Element, () => void>();

export function registerCollector(element: Element, collect: () => void): () => void {
  collectors.set(element, collect);
  return () => collectors.delete(element);
}

export function startSweep(): void {
  const swept = new Set<Element>();
  const collectUnder = (event: PointerEvent) => {
    for (const element of document.elementsFromPoint(event.clientX, event.clientY)) {
      const collect = collectors.get(element);
      if (!collect || swept.has(element)) continue;
      swept.add(element);
      collect();
    }
  };
  const stop = () => {
    window.removeEventListener('pointermove', collectUnder);
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
  };
  window.addEventListener('pointermove', collectUnder);
  window.addEventListener('pointerup', stop);
  window.addEventListener('pointercancel', stop);
}
