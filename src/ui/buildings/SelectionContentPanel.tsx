import { t } from '../../i18n/t';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { useUi } from '../common/hooks';
import { useSelectedBuilding } from './useSelectedBuilding';
import { PanelHeader } from '../common/PanelHeader';
import { BuildingHelp } from './BuildingHelp';
import { BuildingIcon } from './BuildingIcon';
import { BuildingModifications } from './BuildingModifications';
import { BuildingUsage } from './BuildingUsage';

export function SelectionContentPanel() {
  const building = useSelectedBuilding();
  const select = useUi((store) => store.select);
  const debug = useStore(prefsStore, (store) => store.debug);
  if (!building) return null;

  return (
    <>
      <PanelHeader icon={<BuildingIcon building={building} />} title={t(`building.${building.type}`)} onClose={() => select(null)} />
      {debug ? <p className="debug-position">{t('panel.debugPosition')} <code>X {building.x} · Y {building.y}</code></p> : null}
      <BuildingUsage building={building} />
      <BuildingModifications building={building} />
      <BuildingHelp building={building} />
    </>
  );
}
