import {CROPS, type CropId} from '../../core';
import {t} from '../../i18n/t';
import {formatDuration} from '../common/formatDuration';
import {UrbsAmount} from '../common/UrbsAmount';
import {DrawerPanelTitle} from "../common/DrawerPanelTitle.tsx";

interface CropRowProps {
    crop: CropId;
    unlocked: boolean;
    stock: number;
    onPlant: () => void;
    onBuy: (quantity: number) => void;
}

const PACK_SIZES = [1, 5];

export function CropRow({crop, unlocked, stock, onPlant, onBuy}: CropRowProps) {
    const spec = CROPS[crop];
    if (!unlocked) {
        return (
            <li className="crop-row crop-locked">
                🔒 {t(`item.${crop}`)} ({spec.unlockCitizens} {t('stat.citizens')})
            </li>
        );
    }
    return (
        <div className={'crop-row'}>
            <DrawerPanelTitle title={t(`item.${crop}`)} level={stock}/>
            <p>
                {formatDuration(spec.growthMs)} · 💧{spec.water} · ▦{spec.yield}
            </p>
            <div className="slot-actions">
                <button type="button" onClick={onPlant}>
                    {t('farm.plant')}
                </button>
                {PACK_SIZES.map((quantity) => (
                    <button key={quantity} type="button" onClick={() => onBuy(quantity)}>
                        +{quantity} (<UrbsAmount value={quantity * spec.seedPrice}/>)
                    </button>
                ))}
            </div>
            <hr/>
        </div>
    );
}
