import {cityBudget, type CongestionStats, type energyStats, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import {LabeledList} from '../../common/LabeledList';
import {UrbsAmount} from '../../common/UrbsAmount';
import {SectionHeading} from '../../common/SectionHeading';
import {MANAGEMENT_SECTIONS} from './managementSections';

interface BudgetSectionProps {
    state: GameState;
    energy: ReturnType<typeof energyStats>;
    transport: {costPerHour: number};
    congestion: CongestionStats;
}

const amount = (value: number) => <UrbsAmount value={Math.round(value)} thousandSeparator={" "}/>;

export function BudgetSection({state, energy, transport, congestion}: BudgetSectionProps) {
    const {revenues, expenses, net} = cityBudget(state, {energy, congestion, transport});
    return <section id="eco-budget">
        <SectionHeading icon={MANAGEMENT_SECTIONS['eco-budget'].icon}>{t('eco.budgetSection')} · {t('eco.budget')}</SectionHeading>
        <p>{t('eco.budgetHelp')}</p>
        <h3>{t('eco.budgetRevenues')}</h3>
        <LabeledList>
            <LabeledList.Row label={t('eco.budgetTax')}>{amount(revenues.tax)}</LabeledList.Row>
            <LabeledList.Row label={t('eco.budgetOffices')}>{amount(revenues.offices)}</LabeledList.Row>
            <LabeledList.Row label={"total"}><u>{amount(revenues.total)}</u></LabeledList.Row>
        </LabeledList>
        <hr/>
        <h3>{t('eco.budgetExpenses')}</h3>
        <LabeledList>
            <LabeledList.Row label={t('eco.energy')}>{amount(-1 * expenses.energy)}</LabeledList.Row>
            <LabeledList.Row label={t('eco.transport')}>{amount(-1 * expenses.transport)}</LabeledList.Row>
            <LabeledList.Row label={t('stat.water')}>{amount(-1 * expenses.water)}</LabeledList.Row>
            <LabeledList.Row label={t('waste.section.title')}>{amount(-1 * expenses.waste)}</LabeledList.Row>
            <LabeledList.Row label={t('eco.budgetOrdinances')}>{amount(-1 * expenses.ordinances)}</LabeledList.Row>
            <LabeledList.Row label={"total"}><u>{amount(-1 * expenses.total)}</u></LabeledList.Row>
        </LabeledList>
        <hr/>
        <LabeledList>
            <LabeledList.Row label={t('eco.budgetNet')}>{net > 0 ? '+' : ''}{amount(net)}</LabeledList.Row>
        </LabeledList>
    </section>;
}
