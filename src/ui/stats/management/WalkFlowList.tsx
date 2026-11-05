import {t} from '../../../i18n/t';
import {CoordinatesLink} from '../../common/CoordinatesLink';

const LISTED = 5;

interface WalkFlowListProps {
    title: string;
    flows: readonly {tile: {x: number; y: number}; pedestrians: number}[];
}

export function WalkFlowList({title, flows}: WalkFlowListProps) {
    const busiest = flows.filter(flow => flow.pedestrians > 0).slice(0, LISTED);
    if (busiest.length === 0) return null;
    return <>
        {title}:
        <ul>
            {busiest.map(({tile, pedestrians}) => <li key={`${tile.x},${tile.y}`}>
            <CoordinatesLink x={tile.x} y={tile.y}/> {pedestrians.toFixed(0)} {t('eco.walkFlowUnit')}
            </li>)}
        </ul>
    </>;
}
