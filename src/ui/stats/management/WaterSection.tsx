import {utilityCapacity, utilityDemand, waterDemandSplit, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {LabeledList} from '../../common/LabeledList';
import {SectionHeading} from '../../common/SectionHeading';
import {MANAGEMENT_SECTIONS} from './managementSections';

export function WaterSection({state}: { state: GameState }) {
    const split = waterDemandSplit(state);
    return <section id="eco-water">
        <SectionHeading icon={MANAGEMENT_SECTIONS['eco-water'].icon}>{t('stat.water')}</SectionHeading>
        <p>{utilityDemand(state).water} / {utilityCapacity(state).water}</p>
        <LabeledList>
            <LabeledList.Row label={t('water.citizens')}>{split.citizens}</LabeledList.Row>
            <LabeledList.Row label={t('water.agriculture')}>{split.agriculture}</LabeledList.Row>
        </LabeledList>
    </section>;
}
