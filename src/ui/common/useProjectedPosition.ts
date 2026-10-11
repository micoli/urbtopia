import { DependencyList, RefObject, useEffect } from 'react';
import { useStore } from 'zustand';
import { sceneHandle } from '../../store/sceneHandle';
import { venueStore } from '../../store/venueStore';
import { shouldRenderFrame } from '../../scene/renderBudget';

export type ProjectedAnchor = 'center' | 'above';

type Projected = NonNullable<ReturnType<NonNullable<typeof sceneHandle.current>['project']>>;

const ANCHOR_TRANSFORM: Record<ProjectedAnchor, string> = {
    center: 'translate(-50%, -50%)',
    above: 'translate(-50%, -100%)',
};

const frameCallbacks = new Set<() => void>();
const lastTransforms = new WeakMap<HTMLElement, string>();
let loopHandle = 0;
let lastRun = 0;

function runFrameCallbacks(now: number) {
    loopHandle = requestAnimationFrame(runFrameCallbacks);
    if (!shouldRenderFrame(now - lastRun)) return;
    lastRun = now;
    for (const callback of frameCallbacks) callback();
}

function subscribeToFrames(callback: () => void) {
    frameCallbacks.add(callback);
    if (frameCallbacks.size === 1) loopHandle = requestAnimationFrame(runFrameCallbacks);
    return () => {
        frameCallbacks.delete(callback);
        if (frameCallbacks.size === 0) cancelAnimationFrame(loopHandle);
    };
}

export function useFrameLoop(onFrame: () => void, deps: DependencyList) {
    const cityHidden = useStore(venueStore, store => store.venueId !== null);
    useEffect(() => {
        if (cityHidden) return;
        return subscribeToFrames(onFrame);
    }, [...deps, cityHidden]);
}

export function placeProjected(element: HTMLElement, projected: Projected, anchor: ProjectedAnchor, offsetX = 0) {
    const placement = `translate(${projected.x + offsetX}px, ${projected.y}px) ${ANCHOR_TRANSFORM[anchor]} ${projected.visible ? 'visible' : 'hidden'}`;
    if (lastTransforms.get(element) === placement) return;
    lastTransforms.set(element, placement);
    element.style.transform = `translate(${projected.x + offsetX}px, ${projected.y}px) ${ANCHOR_TRANSFORM[anchor]}`;
    element.style.visibility = projected.visible ? 'visible' : 'hidden';
}

export function useProjectedPosition(ref: RefObject<HTMLElement | null>, worldX: number, worldY: number, worldZ: number, anchor: ProjectedAnchor) {
    useFrameLoop(() => {
        const projected = sceneHandle.current?.project(worldX, worldY, worldZ);
        if (ref.current && projected) placeProjected(ref.current, projected, anchor);
    }, [worldX, worldY, worldZ, anchor]);
}
