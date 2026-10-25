import { useRef } from 'react';
import { sceneHandle } from '../../store/sceneHandle';
import { placeProjected, useFrameLoop } from '../common/useProjectedPosition';
import { useUi } from '../common/hooks';

const STOPS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2'];

export function LocatorArrow() {
  const locator = useUi((store) => store.locator);
  const ref = useRef<HTMLDivElement>(null);
  useFrameLoop(() => {
    if (!locator) return;
    const projected = sceneHandle.current?.project(locator.x, locator.y, locator.z);
    if (ref.current && projected) placeProjected(ref.current, projected, 'above');
  }, [locator]);
  if (!locator) return null;

  return (
    <div ref={ref} className="locator-arrow" aria-hidden="true">
      <svg viewBox="0 0 40 120" className="locator-arrow-shape">
        <defs>
          <linearGradient id="locator-arrow-gradient" x1="0" y1="0" x2="0" y2="1">
            {STOPS.map((color, index) => <stop key={color} offset={index / (STOPS.length - 1)} stopColor={color} />)}
          </linearGradient>
        </defs>
        <path d="M14 0 H26 V80 H40 L20 120 L0 80 H14 Z" fill="url(#locator-arrow-gradient)" stroke="#000" strokeOpacity="0.6" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
