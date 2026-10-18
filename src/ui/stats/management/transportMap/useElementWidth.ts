import { useEffect, useState, type RefObject } from 'react';

const FALLBACK_WIDTH = 800;

export function useElementWidth(ref: RefObject<Element | null>): number {
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(element.getBoundingClientRect().width || FALLBACK_WIDTH);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
