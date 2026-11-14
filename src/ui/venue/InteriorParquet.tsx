import { PARQUETS, isHomeType, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import type { MessageKey } from '../../i18n/messages';

interface InteriorParquetProps {
  building: Building;
}

// The floor of an interior: a free choice among the parquets, or the floor of its kind except for a Home, which always has a parquet.
export function InteriorParquet({ building }: InteriorParquetProps) {
  const chosen = building.interior?.parquet;
  const setParquet = (parquet?: number) => gameStore.getState().send({ type: 'SetInteriorParquet', buildingId: building.id, parquet });
  return (
    <section className="venue-build">
      {isHomeType(building.type) ? null : (
        <ActionButton block variant={chosen === undefined ? 'primary' : 'default'} aria-pressed={chosen === undefined} onClick={() => setParquet()}>
          {t('interior.floor.default')}
        </ActionButton>
      )}
      {PARQUETS.map((parquet, index) => {
        const selected = index === (chosen ?? (isHomeType(building.type) ? 0 : -1));
        return (
          <ActionButton key={parquet} block variant={selected ? 'primary' : 'default'} aria-pressed={selected} onClick={() => setParquet(index)}>
            {t(`home.interior.parquet.${parquet}` as MessageKey)}
          </ActionButton>
        );
      })}
    </section>
  );
}
