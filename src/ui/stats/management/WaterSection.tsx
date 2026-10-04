import {utilityCapacity, utilityDemand, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';

export function WaterSection({state}: { state: GameState }) {
    return <section>
        <SectionHeading>{t('stat.water')}</SectionHeading>
        <p>{utilityDemand(state).water} / {utilityCapacity(state).water}</p>
    </section>;
}
