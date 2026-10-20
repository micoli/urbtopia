import { FACTION_IDS, type FactionId } from '../../core';
import { t } from '../../i18n/t';

export function CouncilLegend({ seats }: { seats: Readonly<Record<FactionId, number>> }) {
  return (
    <ul className="council-legend">
      {FACTION_IDS.map(faction => (
        <li key={faction}>
          <svg viewBox="0 0 10 10" width="12" height="12" aria-hidden="true"><circle className="council-seat" data-faction={faction} data-vote="for" cx="5" cy="5" r="4" /></svg>
          {t(`faction.${faction}`)} · {t('politics.council.seats').replace('{seats}', String(seats[faction]))}
        </li>
      ))}
    </ul>
  );
}
