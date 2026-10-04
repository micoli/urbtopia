import {CROP_IDS, fieldCap, isCropUnlocked, seedStockCapacity, seedStockUsed, type Building} from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { uiStore } from '../../store/uiStore';
import { useGame } from '../common/hooks';
import { CropRow } from './CropRow';
import { UpgradeSection } from '../common/UpgradeSection.tsx';
import {DrawerPanelTitle} from "../common/DrawerPanelTitle.tsx";

interface FarmPanelProps {
  building: Building;
}

export function FarmPanel({ building }: FarmPanelProps) {
  const state = useGame((store) => store.state);
  const { chooseTool, selectCrop } = uiStore.getState();
  const send = gameStore.getState().send;

  return (
    <section className="farm">
      <DrawerPanelTitle title={`${t('farm.seedStock')} · ${t('home.tier')}`} level={building.tier}/>
      <p>
          {t('farm.seeds')}: {seedStockUsed(state)}/{seedStockCapacity(state)}
      </p>
      <p>
          {t('farm.fields')}: {state.fields.length}/{fieldCap(state)}
      </p>
      <div className="crops">
        {CROP_IDS.map((crop) => (
          <CropRow
            key={crop}
            crop={crop}
            unlocked={isCropUnlocked(state, crop)}
            stock={state.seedStock[crop] ?? 0}
            onPlant={() => {
              selectCrop(crop);
              chooseTool({ kind: 'brush', action: 'plant', crop, tiles: [] });
            }}
            onBuy={(quantity) => send({ type: 'BuySeeds', crop, quantity })}
          />
        ))}
      </div>
        <div className="slot-actions">
            <button type="button" disabled={state.fields.length >= fieldCap(state)} onClick={() => chooseTool({ kind: 'brush', action: 'layField', tiles: [] })}>{t('farm.layFields')}</button>
            <button type="button" disabled={state.fields.length === 0} onClick={() => chooseTool({ kind: 'brush', action: 'removeField', tiles: [] })}>{t('farm.removeFields')}</button>
        </div>
      <UpgradeSection building={building} />
    </section>
  );
}
