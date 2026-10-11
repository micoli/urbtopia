import type {NeedLevel} from '../../../../core';
import {t} from '../../../../i18n/t';
import {formatSatisfaction, satisfactionColor} from './needsFormat';
import {NeedsFactorRow} from './NeedsFactorRow';
import type {MessageKey} from "../../../../i18n/messages.ts";

interface NeedsTableProps {
    levels: readonly NeedLevel[];
    onShowSection: (id: string) => void;
}

export function NeedsTable({levels, onShowSection}: NeedsTableProps) {
    return <table className="eco-needs-table">
        <thead>
        <tr>
            <th scope="col">{t('needs.col.need')}</th>
            <th scope="col">{t('needs.col.satisfiedBy')}</th>
            <th scope="col">{t('needs.col.measure')}</th>
            <th scope="col">{t('needs.col.satisfaction')}</th>
            <th scope="col">{t('needs.col.effect')}</th>
        </tr>
        </thead>
        {[...levels].reverse().map(level => <tbody key={level.id}>
        <tr className="eco-needs-total">
            <th scope="row" colSpan={3}><h3 style={{color: satisfactionColor(level.satisfaction)}}>{t(`needs.level.${level.id}` as MessageKey)}</h3></th>
            <td style={{color: satisfactionColor(level.satisfaction)}}><strong>{formatSatisfaction(level.satisfaction)}</strong></td>
            <td>&nbsp;</td>
        </tr>
        {level.factors.map(factor => <NeedsFactorRow
            key={factor.id}
            factor={factor}
            onShowSection={onShowSection}
        />)}
        </tbody>)}
    </table>;
}
