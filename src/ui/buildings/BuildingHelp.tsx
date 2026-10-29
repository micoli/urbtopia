import { hasTrips, type Building } from '../../core';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useUi } from '../common/hooks';
import { Icon } from '../common/Icon';
import { CodexLinks } from './CodexLinks';
import { PanelSection } from './PanelSection';

export function BuildingHelp({ building }: { building: Building }) {
  const showBuildingFlows = useUi((store) => store.showBuildingFlows);
  return (
    <PanelSection id="help" title={t('panel.section.help')}>
      <ButtonRow align="stretch" spaced className="side-panel-actions">
        <CodexLinks building={building} />
        {hasTrips(building) ? <ActionButton onClick={() => showBuildingFlows(building.id)}><Icon name="walk" /> {t('panel.flows')}</ActionButton> : null}
      </ButtonRow>
    </PanelSection>
  );
}
