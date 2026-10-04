import { CROP_IDS, fieldCap, isCropUnlocked, seedStockCapacity, seedStockUsed, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { uiStore } from '../../store/uiStore';
import { useGame, useUi } from '../common/hooks';
import { CropRow } from './CropRow';
import { UpgradeSection } from './UpgradeSection';

interface FarmPanelProps {
  building: Building;
}

export function FarmPanel({ building }: FarmPanelProps) {
  const state = useGame((store) => store.state);
  const selectedCrop = useUi((store) => store.selectedCrop);
  const { chooseTool, selectCrop } = uiStore.getState();
  const send = gameStore.getState().send;

  return (
    <section className="farm">
      <h3>
        {t('farm.seedStock')} · {t('home.tier')} {building.tier}
      </h3>
      <p>
        {t('farm.seeds')}: {seedStockUsed(state)}/{seedStockCapacity(state)} · {t('farm.fields')}: {state.fields.length}/{fieldCap(state)}
      </p>
      <div className="slot-actions">
        <button type="button" onClick={() => chooseTool({ kind: 'brush', action: 'layField', tiles: [] })}>{t('farm.layFields')}</button>
        <button type="button" onClick={() => chooseTool({ kind: 'brush', action: 'removeField', tiles: [] })}>{t('farm.removeFields')}</button>
        <button type="button" disabled={selectedCrop === null} onClick={() => selectedCrop && chooseTool({ kind: 'brush', action: 'plant', crop: selectedCrop, tiles: [] })}>
          {t('farm.plant')}
        </button>
        <button type="button" onClick={() => chooseTool({ kind: 'brush', action: 'harvest', tiles: [] })}>{t('farm.harvest')}</button>
      </div>
      <ul className="crops">
        {CROP_IDS.map((crop) => (
          <CropRow
            key={crop}
            crop={crop}
            unlocked={isCropUnlocked(state, crop)}
            selected={selectedCrop === crop}
            stock={state.seedStock[crop] ?? 0}
            onSelect={() => selectCrop(crop)}
            onBuy={(quantity) => send({ type: 'BuySeeds', crop, quantity })}
          />
        ))}
      </ul>
      <UpgradeSection building={building} />
    </section>
  );
}
