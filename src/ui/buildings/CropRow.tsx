import {CROPS, seedSellPrice, type CropId} from '../../core';
import {t} from '../../i18n/t';
import {formatDuration} from '../common/formatDuration';
import {UrbsAmount} from '../common/UrbsAmount';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { DrawerPanel } from '../common/DrawerPanel';

interface CropRowProps {
    crop: CropId;
    unlocked: boolean;
    stock: number;
    onPlant: () => void;
    onBuy: (quantity: number) => void;
    onSell: (quantity: number) => void;
}

const PACK_SIZES = [1, 5];

export function CropRow({crop, unlocked, stock, onPlant, onBuy, onSell}: CropRowProps) {
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
            <DrawerPanel.LabelValue label={t(`item.${crop}`)} value={stock}/>
            <p>
                {formatDuration(spec.growthMs)} · 💧{spec.water} · ▦{spec.yield}
            </p>
            <ButtonRow align="stretch" spaced>
                <ActionButton onClick={onPlant}>
                    {t('farm.plant')}
                </ActionButton>
                {PACK_SIZES.map((quantity) => (
                    <ActionButton key={quantity} onClick={() => onBuy(quantity)}>
                        +{quantity} (<UrbsAmount value={quantity * spec.seedPrice}/>)
                    </ActionButton>
                ))}
            </ButtonRow>
            <ButtonRow align="stretch" spaced>
                {PACK_SIZES.map((quantity) => (
                    <ActionButton key={quantity} disabled={stock < 1} onClick={() => onSell(quantity)}>
                        -{quantity} (+<UrbsAmount value={Math.min(quantity, stock) * seedSellPrice(crop)}/>)
                    </ActionButton>
                ))}
            </ButtonRow>
            <hr/>
        </div>
    );
}
