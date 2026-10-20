import { ORDINANCE_ENTRIES, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { SectionHeading } from '../common/SectionHeading';
import { OrdinanceRow } from './OrdinanceRow';

export function OrdinancesSection({ state }: { state: GameState }) {
  if (!state.politics) return null;
  return (
    <section id="politics-ordinances" className="eco-wide">
      <SectionHeading>{t('politics.ordinances')}</SectionHeading>
      <ul className="politics-list">
        {ORDINANCE_ENTRIES.map(entry => <OrdinanceRow key={entry.id} state={state} id={entry.id} />)}
      </ul>
    </section>
  );
}
