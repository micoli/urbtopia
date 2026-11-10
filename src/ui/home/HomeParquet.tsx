import { PARQUETS, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import type { MessageKey } from '../../i18n/messages';

interface HomeParquetProps {
  home: Building;
}

// The floor of a Home interior: a free choice among the parquets.
export function HomeParquet({ home }: HomeParquetProps) {
  const chosen = home.floor?.parquet ?? 0;
  return (
    <section className="venue-build">
      {PARQUETS.map((parquet, index) => (
        <ActionButton key={parquet} block variant={index === chosen ? 'primary' : 'default'} aria-pressed={index === chosen} onClick={() => gameStore.getState().send({ type: 'SetHomeParquet', buildingId: home.id, parquet: index })}>
          {t(`home.interior.parquet.${parquet}` as MessageKey)}
        </ActionButton>
      ))}
    </section>
  );
}
