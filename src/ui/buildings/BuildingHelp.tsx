import { hasTrips, type Building } from '../../core';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useUi } from '../common/hooks';
import { Icon } from '../common/Icon';
import { CodexLinks } from './CodexLinks';
import { ManagementLinkButton } from './ManagementLinkButton';
import { managementSectionsOf } from './managementSectionsOf';
import { PanelSection } from './PanelSection';

export function BuildingHelp({ building }: { building: Building }) {
  const showBuildingFlows = useUi((store) => store.showBuildingFlows);
  const showManagementSection = useUi((store) => store.showManagementSection);
  return (
    <PanelSection id="help" title={t('panel.section.help')}>
      <ButtonRow align="stretch" spaced className="side-panel-actions">
        {hasTrips(building) ? <ActionButton variant="success" onClick={() => showBuildingFlows(building.id)}><Icon name="walk" /> {t('panel.flows')}</ActionButton> : null}
        {managementSectionsOf(building).map((section) => <ManagementLinkButton key={section} section={section} onOpen={() => showManagementSection(section)} />)}
        <CodexLinks building={building} />
      </ButtonRow>
    </PanelSection>
  );
}
