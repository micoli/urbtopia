import type {WasteSituation} from '../../../../core';
import type {MessageKey} from '../../../../i18n/messages';
import {t} from '../../../../i18n/t';
import {UrbsAmount} from '../../../common/UrbsAmount';

export function WasteFamilies({families}: {families: WasteSituation['families']}) {
    return <>
        <h4>{t('waste.families.title')}</h4>
        <table>
            <thead>
                <tr>
                    <th/>
                    <th>{t('waste.families.buildings')}</th>
                    <th>{t('waste.families.capacity')}</th>
                    <th>{t('waste.families.processed')}</th>
                    <th>{t('waste.families.cost')}</th>
                    <th/>
                </tr>
            </thead>
            <tbody>
                {families.map(family => <tr key={family.kind}>
                    <th scope="row">{t(`building.${family.kind}` as MessageKey)}</th>
                    <td>{family.buildings}</td>
                    <td>{family.capacity < family.nominalCapacity ? `${family.capacity.toFixed(0)} / ${family.nominalCapacity}` : family.capacity}</td>
                    <td>{family.processed.toFixed(0)}</td>
                    <td><UrbsAmount value={family.costPerDay}/></td>
                    <td>
                        {family.stoppedNoUrbs > 0 && <span data-warning="true">{t('waste.families.stoppedNoUrbs').replace('{count}', String(family.stoppedNoUrbs))}</span>}
                        {family.stoppedNoRoad > 0 && <span data-warning="true">{t('waste.families.stoppedNoRoad').replace('{count}', String(family.stoppedNoRoad))}</span>}
                        {family.stoppedPowerShortage > 0 && <span data-warning="true">{t('waste.families.stoppedPowerShortage').replace('{count}', String(family.stoppedPowerShortage))}</span>}
                        {family.reducedByPower > 0 && <span data-warning="true">{t('waste.families.reducedByPower').replace('{count}', String(family.reducedByPower))}</span>}
                    </td>
                </tr>)}
            </tbody>
        </table>
    </>;
}
