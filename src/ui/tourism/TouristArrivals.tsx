import type { AttractionRow } from '../../core';
import { t } from '../../i18n/t';
import { Icon } from '../common/Icon';
import type { IconName } from '../common/iconRegistry';

const MODES: readonly { mode: keyof AttractionRow['modes']; icon: IconName; label: 'attraction.mode.car' | 'attraction.mode.walk' | 'attraction.mode.transit' }[] = [
  { mode: 'car', icon: 'car', label: 'attraction.mode.car' },
  { mode: 'walk', icon: 'walk', label: 'attraction.mode.walk' },
  { mode: 'transit', icon: 'bus', label: 'attraction.mode.transit' },
];

export function TouristArrivals({ modes }: Pick<AttractionRow, 'modes'>) {
  const total = modes.car + modes.walk + modes.transit;
  if (total <= 0) return null;
  const present = MODES.filter(({ mode }) => modes[mode] > 0);
  return (
    <div className="tourist-arrivals">
      <p className="tourism-label">{t('attraction.arrivals')}</p>
      <div className="mode-bar" aria-hidden="true">
        {present.map(({ mode }) => <span key={mode} data-mode={mode} style={{ flexGrow: modes[mode] }} />)}
      </div>
      <ul className="mode-legend">
        {present.map(({ mode, icon, label }) => <li key={mode} data-mode={mode}><Icon name={icon} /> {t(label)} {Math.round((modes[mode] / total) * 100)} %</li>)}
      </ul>
      {modes.walk === 0 && modes.transit === 0 ? <p className="tourism-help">{t('attraction.arrivalsCarOnly')}</p> : null}
    </div>
  );
}
