import {wasteSituation, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {BottleneckButton} from './BottleneckButton';
import {WasteBalance} from './waste/WasteBalance';
import {WasteCodexLink} from './waste/WasteCodexLink';
import {WasteCoverage} from './waste/WasteCoverage';
import {WasteFamilies} from './waste/WasteFamilies';
import {WasteImpacts} from './waste/WasteImpacts';
import {WastePedestrian} from './waste/WastePedestrian';

interface WasteSectionProps {
    state: GameState;
    onShowEmissions: () => void;
}

export function WasteSection({state, onShowEmissions}: WasteSectionProps) {
    const situation = wasteSituation(state);
    return <section id="eco-waste">
        <SectionHeading icon="🗑️">{t('waste.section.title')}</SectionHeading>
        <p>{t('waste.section.help')}</p>
        {situation.produced === 0 && <p>{t('waste.section.noHomes')}</p>}
        {!situation.required && <p>{t('waste.section.notRequired')}</p>}
        {situation.capacity === 0 && <p>{t('waste.section.noFacility')}</p>}
        <WasteBalance situation={situation}/>
        <WasteFamilies families={situation.families}/>
        <WasteCoverage situation={situation}/>
        <WasteImpacts situation={situation} onShowEmissions={onShowEmissions}/>
        <WastePedestrian situation={situation}/>
        {situation.bottleneck && <BottleneckButton bottleneck={{tile: situation.bottleneck}}/>}
        <WasteCodexLink/>
    </section>;
}
