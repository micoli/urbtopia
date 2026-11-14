import { interiorExampleOf, type Building, type FixtureId } from '../../core';
import type { MessageKey } from '../../i18n/messages';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { InteriorExampleGrid } from './InteriorExampleGrid';

interface InteriorExampleDialogProps {
  building: Building;
  onClose: () => void;
}

const distinctTypes = (types: readonly FixtureId[]): FixtureId[] => [...new Set(types)];

// An example of a set-up that produces, stores and uses what the Machines of the interior make.
export function InteriorExampleDialog({ building, onClose }: InteriorExampleDialogProps) {
  const example = interiorExampleOf(building.type);
  if (!example) return null;
  const legend = distinctTypes(example.fixtures.map(fixture => fixture.type));
  return (
    <Dialog className="interior-example">
      <Dialog.Title>{t('interior.examples.title')} · {t(`building.${building.type}`)}</Dialog.Title>
      <Dialog.Body>
        <p className="note">{t(`interior.examples.${building.type}` as MessageKey)}</p>
        <p className="note note--muted">{t('interior.examples.tier').replace('{tier}', String(example.tier))}</p>
        <InteriorExampleGrid fixtures={example.fixtures} />
        <h3>{t('interior.examples.legend')}</h3>
        <ul className="interior-example__legend">
          {legend.map(id => <li key={id} className="note">{t(`venue.fixture.${id}`)}</li>)}
        </ul>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton variant="primary" onClick={onClose}>{t('panel.close')}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
