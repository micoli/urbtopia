import {useUi} from '../../common/hooks';

// Closes the management page and shows the Attraction, selected, on the map.
export function useShowAttraction(): (id: number) => void {
    const select = useUi(store => store.select);
    const showBuilding = useUi(store => store.showBuilding);
    return id => {
        select(id);
        showBuilding(id);
    };
}
