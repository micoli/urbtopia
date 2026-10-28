import {cityBenefits, energyStats, transportStats, type GameState, isHomeType } from '../../../core';
import {t} from '../../../i18n/t';
import type {MessageKey} from '../../../i18n/messages';
import {gameStore} from '../../../store/gameStore';
import {ActionButton} from '../../common/ActionButton';
import {SectionHeading} from '../../common/SectionHeading';
import { Icon } from '../../common/Icon';

interface ObjectivesSectionProps {
    state: GameState;
    energy: ReturnType<typeof energyStats>;
    green: ReturnType<typeof cityBenefits>;
    transport: ReturnType<typeof transportStats>;
}

export function ObjectivesSection({state, energy, green, transport}: ObjectivesSectionProps) {
    if (state.ecologyDismissed) return null;
    const objectives: [MessageKey, boolean][] = [
        ['eco.objectiveInsulate', state.buildings.some(b => isHomeType(b.type) && b.insulated)], ['eco.objectiveGreen', green.covered > 0],
        ['eco.objectiveShare', energy.transfers.length > 0], ['eco.objectiveBattery', energy.stored > 0], ['eco.objectiveBus', transport.riders > 0],
    ];
    return <section className="eco-wide eco-objectives">
        <SectionHeading>{t('eco.objectives')}</SectionHeading>
        {objectives.map(([key, done]) => <p key={key} data-complete={done}>{done ? <Icon name="check" /> : '○'} {t(key)}</p>)}
        <ActionButton variant="primary" className="eco-primary" onClick={() => gameStore.getState().send({type: 'DismissEcology'})}>{t('eco.dismiss')}</ActionButton>
    </section>;
}
