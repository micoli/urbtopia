import { useState } from 'react';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';
import { DistrictDemonstrationDialog } from './DistrictDemonstrationDialog';

// Opens the lesson of the District plan.
export function DistrictLessonButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ActionButton size="sm" onClick={() => setOpen(true)}><Icon name="info" /> {t('district.howToPlay')}</ActionButton>
      {open ? <DistrictDemonstrationDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}
