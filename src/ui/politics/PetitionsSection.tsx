import type { MessageKey } from '../../i18n/messages';
import type { GameState } from '../../core';
import { t } from '../../i18n/t';
import { SectionHeading } from '../common/SectionHeading';
import { PetitionRow } from './PetitionRow';

export function PetitionsSection({ state }: { state: GameState }) {
  const politics = state.politics;
  if (!politics) return null;
  return (
    <section id="politics-petitions" className="eco-wide">
      <SectionHeading>{t('politics.petitions')}</SectionHeading>
      {politics.petitions.length === 0 && <p>{t('politics.petition.none')}</p>}
      <ul className="politics-list">
        {politics.petitions.map(petition => <PetitionRow key={petition.id} petition={petition} day={politics.day} />)}
      </ul>
      <SectionHeading>{t('politics.support')}</SectionHeading>
      {politics.supports.length === 0 && <p>{t('politics.support.none')}</p>}
      <ul className="politics-list">
        {politics.supports.map(support => (
          <li key={support.id} className="politics-row" data-support>
            <div className="politics-row-text">
              <strong>{t(`politics.support.${support.cause}` as MessageKey)}</strong>
              <small>{t('politics.petition.district').replace('{x}', String(support.parcel.x)).replace('{y}', String(support.parcel.y))}</small>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
