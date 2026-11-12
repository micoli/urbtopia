import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { useUi } from '../common/hooks';
import { Icon } from '../common/Icon';
import { PanelHeader } from '../common/PanelHeader';
import { PanelSection } from './PanelSection';
import { useSelectedAccess } from './useSelectedAccess';

export function AccessPanel() {
  const access = useSelectedAccess();
  const moveAccess = useUi((store) => store.moveSelectedAccess);
  const select = useUi((store) => store.select);
  if (!access) return null;
  const { tile, rotation } = access;
  const turn = (step: 1 | 3) => gameStore.getState().send({ type: 'MovePedestrianAccess', from: tile, x: tile.x, y: tile.y, rotation: ((rotation + step) % 4) as 0 | 1 | 2 | 3 });
  const demolish = () => {
    gameStore.getState().send({ type: 'DemolishPedestrianAccess', x: tile.x, y: tile.y });
    select(null);
  };
  return (
    <>
      <PanelHeader icon={<Icon name="map" />} title={t('access.title')} onClose={() => select(null)} debugNode={access} />
      <p>{t('access.help')}</p>
      <PanelSection id="modifications" title={t('panel.section.modifications')}>
        <ButtonRow align="stretch" spaced className="side-panel-actions">
          <ActionButton aria-label={t('panel.rotateLeft')} onClick={() => turn(1)}><Icon name="rotateLeft" /></ActionButton>
          <ActionButton aria-label={t('panel.move')} onClick={moveAccess}><Icon name="move" /></ActionButton>
          <ActionButton aria-label={t('panel.rotateRight')} onClick={() => turn(3)}><Icon name="rotateRight" /></ActionButton>
        </ButtonRow>
        <ActionButton className="mt-4" onClick={demolish}>
          <Icon name="trash" /> {t('access.demolish')}
        </ActionButton>
      </PanelSection>
    </>
  );
}
