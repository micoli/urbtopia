import type { UnfilledWorkplace } from '../../../core';
import { t } from '../../../i18n/t';
import { ActionButton } from '../../common/ActionButton';
import { useUi } from '../../common/hooks';

interface UnfilledJobsListProps {
    workplaces: readonly UnfilledWorkplace[];
}

export function UnfilledJobsList({workplaces}: UnfilledJobsListProps) {
    const showBuilding = useUi(store => store.showBuilding);
    if (workplaces.length === 0) return null;
    return <>
        <h4>{t('eco.unfilledJobs')}</h4>
        <p>{t('eco.unfilledJobsHelp')}</p>
        <ul className="eco-unfilled-jobs">
            {workplaces.map(({building, offered, filled}) => <li key={building.id}>
                <span>{building.name ?? t(`building.${building.type}`)}: {Math.round(filled)} / {offered}</span>
                <ActionButton size="xs" onClick={() => showBuilding(building.id)}>{t('eco.showWorkplace')}</ActionButton>
            </li>)}
        </ul>
    </>;
}
