import { useState } from 'react';
import { createPortal } from 'react-dom';
import { interiorExampleOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { InteriorExampleDialog } from './InteriorExampleDialog';

interface InteriorExamplesProps {
  building: Building;
}

// The button of the Management panel that opens an example of a set-up of the interior. The dialog goes to the body: the side panel is glass, which would hold it inside.
export function InteriorExamples({ building }: InteriorExamplesProps) {
  const [open, setOpen] = useState(false);
  if (!interiorExampleOf(building.type)) return null;
  return (
    <>
      <ActionButton block onClick={() => setOpen(true)}>{t('interior.examples.show')}</ActionButton>
      {open ? createPortal(<InteriorExampleDialog building={building} onClose={() => setOpen(false)} />, document.body) : null}
    </>
  );
}
