import type { ReactNode } from 'react';
import { t } from '../../i18n/t';
import type { Hex } from '../../core';
import { HexGlyph } from './HexGlyph';

interface DistrictHandProps {
  current: Hex | undefined;
  upcoming: readonly Hex[];
  // What stands to the right of the Hexes to come.
  children?: ReactNode;
}

export function DistrictHand({ current, upcoming, children }: DistrictHandProps) {
  return (
    <div className="district-hand">
      {current ? <div className="district-hand__current"><HexGlyph hex={current} label={t('district.hand')} /></div> : null}
      {upcoming.length > 0 ? (
        <div className="district-hand__next" aria-label={t('district.next')}>
          {upcoming.map((hex, index) => <HexGlyph key={index} hex={hex} label={t('district.next')} />)}
        </div>
      ) : null}
      {children}
    </div>
  );
}
