import { t } from '../../i18n/t';
import type { Hex } from '../../core';
import { HexGlyph } from './HexGlyph';

interface DistrictHandProps {
  current: Hex | undefined;
  upcoming: readonly Hex[];
}

export function DistrictHand({ current, upcoming }: DistrictHandProps) {
  if (!current) return null;
  return (
    <div className="district-hand">
      <div className="district-hand__current"><HexGlyph hex={current} label={t('district.hand')} /></div>
      <div className="district-hand__next" aria-label={t('district.next')}>
        {upcoming.map((hex, index) => <HexGlyph key={index} hex={hex} label={t('district.next')} />)}
      </div>
    </div>
  );
}
