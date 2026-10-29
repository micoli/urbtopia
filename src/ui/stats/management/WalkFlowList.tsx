import {t} from '../../../i18n/t';

const LISTED = 5;

interface WalkFlowListProps {
    title: string;
    flows: readonly {tile: {x: number; y: number}; pedestrians: number}[];
}

export function WalkFlowList({title, flows}: WalkFlowListProps) {
    const busiest = flows.filter(flow => flow.pedestrians > 0).slice(0, LISTED);
    if (busiest.length === 0) return null;
    return <p>{title}: {busiest.map(({tile, pedestrians}) => `(${tile.x}, ${tile.y}) ${pedestrians.toFixed(0)} ${t('eco.walkFlowUnit')}`).join(' · ')}</p>;
}
