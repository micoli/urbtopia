import {ActionButton} from '../../common/ActionButton';
import {SANCTIONS, difficultyOf, needsPyramid, totalCitizens, type GameState} from '../../../core';
import {t} from '../../../i18n/t';
import type {MessageKey} from '../../../i18n/messages';
import {SectionHeading} from '../../common/SectionHeading';
import {NeedsPyramidDiagram} from './needs/NeedsPyramidDiagram';
import {NeedsTable} from './needs/NeedsTable';

interface NeedsSectionProps {
    state: GameState;
    onShowSection: (id: string) => void;
}

export function NeedsSection({state, onShowSection}: NeedsSectionProps) {
    const pyramid = needsPyramid(state);
    const bottleneck = pyramid.bottleneck;
    const difficulty = difficultyOf(state);
    const help = difficulty === 'cozy'
        ? t('needs.help')
        : t('needs.help.sanctions')
            .replace('{difficulty}', t(`difficulty.${difficulty}` as MessageKey))
            .replace('{floor}', String(Math.round(100 * SANCTIONS[difficulty].taxFloor)));
    return <section id="eco-needs" className="eco-wide">
        <SectionHeading icon="needs">{t('needs.title')}</SectionHeading>
        <p>{help}</p>
        {totalCitizens(state) === 0 && <p>{t('needs.noCitizens')}</p>}
        <NeedsPyramidDiagram levels={pyramid.levels}/>
        {bottleneck && bottleneck.section && <p>
            {t('needs.bottleneck')}: <strong>{t(`needs.factor.${bottleneck.id}` as MessageKey)}</strong>{' '}
            <ActionButton size="xs" onClick={() => onShowSection(bottleneck.section!)}>{t('needs.show')}</ActionButton>
        </p>}
        <NeedsTable levels={pyramid.levels} onShowSection={onShowSection}/>
    </section>;
}
