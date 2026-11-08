import { useShallow } from 'zustand/react/shallow';
import {CROP_IDS, fieldCap, isCropUnlocked, seedStockCapacity, seedStockUsed, type Building} from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { uiStore } from '../../store/uiStore';
import { useGame } from '../common/hooks';
import { CropRow } from './CropRow';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { BlockedReason } from '../common/BlockedReason';

interface FarmPanelProps {
  building: Building;
}

export function FarmPanel(_props: FarmPanelProps) {
  const fieldCount = useGame((store) => store.state.fields.length);
  const cap = useGame((store) => fieldCap(store.state));
  const seedsUsed = useGame((store) => seedStockUsed(store.state));
  const seedsCapacity = useGame((store) => seedStockCapacity(store.state));
  const seedStock = useGame((store) => store.state.seedStock);
  const unlocked = useGame(useShallow((store) => CROP_IDS.map((crop) => isCropUnlocked(store.state, crop))));
  const { chooseTool, selectCrop } = uiStore.getState();
  const send = gameStore.getState().send;

  return (
    <section className="farm">
      <p>
          {t('farm.seeds')}: {seedsUsed}/{seedsCapacity}
      </p>
      <p>
          {t('farm.fields')}: {fieldCount}/{cap}
      </p>
      <hr/>
      <div className="crops">
        {CROP_IDS.map((crop, index) => (
          <CropRow
            key={crop}
            crop={crop}
            unlocked={unlocked[index] ?? false}
            stock={seedStock[crop] ?? 0}
            onPlant={() => {
              selectCrop(crop);
              chooseTool({ kind: 'brush', action: 'plant', crop, tiles: [] });
            }}
            onBuy={(quantity) => send({ type: 'BuySeeds', crop, quantity })}
            onSell={(quantity) => send({ type: 'SellSeeds', crop, quantity })}
          />
        ))}
      </div>
        <BlockedReason reason={fieldCount >= cap ? t('farm.fieldCap') : fieldCount === 0 ? t('farm.noFields') : null} />
        <ButtonRow align="stretch" spaced>
            <ActionButton disabled={fieldCount >= cap} onClick={() => chooseTool({ kind: 'brush', action: 'layField', tiles: [] })}>{t('farm.layFields')}</ActionButton>
            <ActionButton disabled={fieldCount === 0} onClick={() => chooseTool({ kind: 'brush', action: 'removeField', tiles: [] })}>{t('farm.removeFields')}</ActionButton>
        </ButtonRow>
    </section>
  );
}
