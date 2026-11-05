import type {Building} from '../../../core';
import {t} from '../../../i18n/t';
import {CoordinatesLink} from '../../common/CoordinatesLink';

export function BuildingReference({building, id}: { building: Building | undefined; id: number }) {
    if (!building) return <>#{id}</>;
    return <>{building.name ?? t(`building.${building.type}`)} <CoordinatesLink x={building.x} y={building.y}/></>;
}
