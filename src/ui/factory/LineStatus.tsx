import { FIXTURES, lineFaultOf, type VenueFixture } from '../../core';
import { useMemo } from 'react';
import { t } from '../../i18n/t';

interface LineStatusProps {
  lined: boolean;
  fixture: VenueFixture;
  fixtures: readonly VenueFixture[];
}

// What a selected Fixture of a Line carries: whether Packets reach an Exit through it, and for an Exit the size of Goods it serves.
export function LineStatus({ lined, fixture, fixtures }: LineStatusProps) {
  const size = FIXTURES[fixture.type].packSize;
  const fault = useMemo(() => (lined ? undefined : lineFaultOf(fixtures, fixture)), [lined, fixtures, fixture]);
  const named = fault && 'fixture' in fault ? fault.fixture : fault?.of;
  return (
    <>
      {size && <p className="note">{t('packhouse.interior.exitSize').replace('{size}', t(`packhouse.interior.size.${size}`))}</p>}
      {fault && named ? <p className="note note--warn">{t(`packhouse.interior.fault.${fault.kind}`).replace('{name}', t(`venue.fixture.${named.type}`))}</p> : <p className={lined ? 'note' : 'note note--warn'}>{t(lined ? 'packhouse.interior.lined' : 'packhouse.interior.idle')}</p>}
    </>
  );
}
