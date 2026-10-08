import { DependencyList, RefObject, useEffect } from 'react';
import { useStore } from 'zustand';
import { sceneHandle } from '../../store/sceneHandle';
import { venueStore } from '../../store/venueStore';

export type ProjectedAnchor = 'center' | 'above';

type Projected = NonNullable<ReturnType<NonNullable<typeof sceneHandle.current>['project']>>;

const ANCHOR_TRANSFORM: Record<ProjectedAnchor, string> = {
    center: 'translate(-50%, -50%)',
    above: 'translate(-50%, -100%)',
};

export function useFrameLoop(onFrame: () => void, deps: DependencyList) {
    const cityHidden = useStore(venueStore, store => store.venueId !== null);
    useEffect(() => {
        if (cityHidden) return;
        let handle = 0;
        const tick = () => {
            onFrame();
            handle = requestAnimationFrame(tick);
        };
        handle = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(handle);
    }, [...deps, cityHidden]);
}

export function placeProjected(element: HTMLElement, projected: Projected, anchor: ProjectedAnchor, offsetX = 0) {
    element.style.transform = `translate(${projected.x + offsetX}px, ${projected.y}px) ${ANCHOR_TRANSFORM[anchor]}`;
    element.style.visibility = projected.visible ? 'visible' : 'hidden';
}

export function useProjectedPosition(ref: RefObject<HTMLElement | null>, worldX: number, worldY: number, worldZ: number, anchor: ProjectedAnchor) {
    useFrameLoop(() => {
        const projected = sceneHandle.current?.project(worldX, worldY, worldZ);
        if (ref.current && projected) placeProjected(ref.current, projected, anchor);
    }, [worldX, worldY, worldZ, anchor]);
}
