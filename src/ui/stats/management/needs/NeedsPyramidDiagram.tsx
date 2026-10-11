import type {NeedLevel} from '../../../../core';
import {t} from '../../../../i18n/t';
import type {MessageKey} from '../../../../i18n/messages';
import {formatSatisfaction, satisfactionColor} from './needsFormat';

export function NeedsPyramidDiagram({levels}: { levels: readonly NeedLevel[] }) {
    return <ol className="eco-needs-pyramid">
        {[...levels].reverse().map(level => <li key={level.id} data-level={level.id} data-fragile={level.fragile}>
            <span className="eco-needs-name">{t(`needs.level.${level.id}` as MessageKey)}</span>
            <span className="eco-needs-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.satisfaction ?? 0)}
                  aria-label={t(`needs.level.${level.id}` as MessageKey)}>
                <span style={{width: `${level.satisfaction ?? 0}%`, background: satisfactionColor(level.satisfaction)}}/>
            </span>
            <strong style={{color: satisfactionColor(level.satisfaction)}}>{formatSatisfaction(level.satisfaction)}</strong>
            {level.fragile && <small title={t('needs.fragileHelp')}>{t('needs.fragile')}</small>}
        </li>)}
    </ol>;
}
