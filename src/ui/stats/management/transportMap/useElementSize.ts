import { useEffect, useState, type RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

const FALLBACK: ElementSize = { width: 800, height: 360 };

export function useElementSize(ref: RefObject<Element | null>): ElementSize {
  const [size, setSize] = useState(FALLBACK);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width || FALLBACK.width, height: rect.height || FALLBACK.height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
