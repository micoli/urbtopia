import { FIXTURES, type VenueFixture } from '../../core';
import { t } from '../../i18n/t';

interface LineStatusProps {
  lined: boolean;
  fixture: VenueFixture;
}

// What a selected Fixture of a Line carries: whether Packets reach an Exit through it, and for an Exit the size of Goods it serves.
export function LineStatus({ lined, fixture }: LineStatusProps) {
  const size = FIXTURES[fixture.type].packSize;
  return (
    <>
      {size && <p className="note">{t('packhouse.floor.exitSize').replace('{size}', t(`packhouse.floor.size.${size}`))}</p>}
      <p className={lined ? 'note' : 'note note--warn'}>{t(lined ? 'packhouse.floor.lined' : 'packhouse.floor.idle')}</p>
    </>
  );
}
