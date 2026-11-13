import type { Building } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

interface InteriorFeaturesProps {
  building: Building;
}

// What an interior does.
export function InteriorFeatures({ building }: InteriorFeaturesProps) {
  return (
    <>
      <h3>{t('interior.features')}</h3>
      <p className="note">{t(`interior.features.${building.type}` as MessageKey)}</p>
    </>
  );
}
