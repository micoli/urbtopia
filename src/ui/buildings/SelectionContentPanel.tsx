import { GAME_CONFIG, placementCost } from '../../core';
import { t } from '../../i18n/t';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { useUi } from '../common/hooks';
import { useSelectedBuilding } from './useSelectedBuilding';
import { UrbsAmount } from '../common/UrbsAmount';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { PanelHeader } from '../common/PanelHeader';
import { Icon } from '../common/Icon';
import { BuildingHelp } from './BuildingHelp';
import { BuildingModifications } from './BuildingModifications';
import { BuildingUsage } from './BuildingUsage';

export function SelectionContentPanel() {
  const building = useSelectedBuilding();
  const select = useUi((store) => store.select);
  const sellSelected = useUi((store) => store.sellSelected);
  const debug = useStore(prefsStore, (store) => store.debug);
  if (!building) return null;

  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return (
    <>
      <PanelHeader title={t(`building.${building.type}`)} subtitle={building.tier} onClose={() => select(null)} />
      {debug ? <p className="debug-position">{t('panel.debugPosition')} <code>X {building.x} · Y {building.y}</code></p> : null}
      <BuildingModifications building={building} />
      <BuildingUsage building={building} />
      <BuildingHelp building={building} />
      <ButtonRow align="stretch" spaced className="side-panel-actions">
        <ActionButton onClick={sellSelected}>
          <Icon name="trash" /> {t('panel.sell')} +<UrbsAmount value={refund} />
        </ActionButton>
      </ButtonRow>
    </>
  );
}
