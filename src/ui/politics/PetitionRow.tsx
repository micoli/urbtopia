import type { Petition } from '../../core';
import { t } from '../../i18n/t';
import { causeLabel } from './causeLabel';

export function PetitionRow({ petition, day }: { petition: Petition; day: number }) {
  return (
    <li className="politics-row" data-escalated={petition.escalated}>
      <div className="politics-row-text">
        <strong>{t('politics.petition.missing').replace('{cause}', causeLabel(petition.cause))}</strong>
        <small>{t('politics.petition.district').replace('{x}', String(petition.parcel.x)).replace('{y}', String(petition.parcel.y))} · {t('politics.petition.age').replace('{days}', String(Math.max(0, day - petition.since)))}</small>
        {petition.escalated && <small className="politics-row-status">{t('politics.petition.escalated')}</small>}
      </div>
    </li>
  );
}
