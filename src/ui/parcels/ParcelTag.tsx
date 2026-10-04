import { useRef } from 'react';
import { GAME_CONFIG } from '../../core';
import { useProjectedPosition } from '../common/useProjectedPosition';

interface ParcelTagProps {
  parcelX: number;
  parcelY: number;
  price: number;
}

export function ParcelTag({ parcelX, parcelY, price }: ParcelTagProps) {
  const ref = useRef<HTMLDivElement>(null);

  const size = GAME_CONFIG.parcelSizeInTiles;
  useProjectedPosition(ref, parcelX * size + size / 2, 0.5, parcelY * size + size / 2, 'center');

  return (
    <div ref={ref} className="parcel-tag">
      {price}
    </div>
  );
}
