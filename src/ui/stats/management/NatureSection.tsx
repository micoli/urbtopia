import {cityBenefits, greenProfileOf, totalCitizens, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import type {MessageKey} from '../../../i18n/messages';
import {SectionHeading} from '../../common/SectionHeading';
import {LabeledList} from '../../common/LabeledList';

interface NatureSectionProps {
    state: GameState;
    green: ReturnType<typeof cityBenefits>;
}

export function NatureSection({state, green}: NatureSectionProps) {
    const rows: [MessageKey, number][] = [
        ['eco.cooling', green.cooling], ['eco.biodiversity', green.biodiversity], ['eco.wellbeing', green.wellbeing], ['eco.greenCoverage', green.covered],
    ];
    return <section id="eco-nature">
        <SectionHeading icon="♧">{t('build.greenSpaces')}</SectionHeading>
        <p>{t('build.greenSpaces')}: {state.buildings.filter(b => greenProfileOf(b.type)).length}</p>
        <LabeledList>
            {rows.map(([key, value]) => <LabeledList.Row key={key} label={t(key)}>
                {value.toFixed(1)}{key === 'eco.greenCoverage' ? '' : ' / 100'}
            </LabeledList.Row>)}
        </LabeledList>
        <p>{t('eco.greenHelp')}</p>
        {green.covered < totalCitizens(state) && <p>{t('eco.adviceGreen')}</p>}
    </section>;
}
