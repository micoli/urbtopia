import { useEffect, useRef } from 'react';
import { GameScene } from '../../scene/GameScene';
import { prefsStore } from '../../i18n/prefsStore';
import { gameStore } from '../../store/gameStore';
import { harvestEffects } from '../../store/harvestEffects';
import { sceneHandle } from '../../store/sceneHandle';
import { uiStore } from '../../store/uiStore';
import { pointerKindOf } from '../../tools/aim';
import { FACILITIES, isFacilityType } from '../../core';
import { selectionGhost } from '../../tools/tools';
import { readCameraView, writeCameraView, type CameraView } from '../../scene/cameraUrl';
import { isAlwaysDayRequested, pinnedCycleHourOf } from '../../store/dayCycleFlags';
import { hideSplash, setSplashProgress } from '../system/splash';

const URL_UPDATE_DELAY_MS = 500;

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new GameScene(canvas);
    sceneHandle.current = scene;
    scene.camera.setView(readCameraView(window.location.search));
    scene.setStreetViewExit(() => uiStore.getState().exitStreetView());
    const currentUrl = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const urlFor = (view: CameraView) => `${window.location.pathname}${writeCameraView(window.location.search, view)}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', urlFor(scene.camera.view));
    let urlTimer: number | undefined;
    scene.camera.onViewChange = (view) => {
      window.clearTimeout(urlTimer);
      urlTimer = window.setTimeout(() => {
        const url = urlFor(view);
        if (url === currentUrl()) return;
        window.history.pushState(window.history.state, '', url);
      }, URL_UPDATE_DELAY_MS);
    };
    const onPopState = () => {
      window.clearTimeout(urlTimer);
      scene.camera.setView(readCameraView(window.location.search));
    };
    window.addEventListener('popstate', onPopState);
    scene.setHandlers({
      onTap: (tile, shiftKey, buildingId) => {
        const ui = uiStore.getState();
        if (ui.streetViewPicking) return ui.dropStreetView(tile);
        if (ui.tool && ui.pointerKind === 'mouse') return ui.clickTile(tile, shiftKey);
        if (ui.tool) return ui.pinTile(tile);
        ui.tapTile(tile, buildingId);
      },
      onLongPress: (buildingId) => {
        const ui = uiStore.getState();
        if (ui.tool) return false;
        ui.select(buildingId);
        ui.moveSelected();
        return true;
      },
      onCenterTileChange: (tile) => uiStore.getState().setCenterTile(tile),
      onMouseMove: (tile) => uiStore.getState().hoverTile(tile),
      onPointerKind: (pointerType) => uiStore.getState().setPointerKind(pointerKindOf(pointerType)),
      onSecondaryClick: () => {
        uiStore.getState().cancelPickStreetView();
        uiStore.getState().cancelTool();
      },
      onGrabStart: (tile) => uiStore.getState().grabGhost(tile),
      onGrabMove: (tile) => uiStore.getState().dragGhost(tile),
      onBrushStart: (tile) => uiStore.getState().brushStart(tile),
      onBrushMove: (tile) => uiStore.getState().brushMove(tile),
      onBrushEnd: () => uiStore.getState().brushEnd(),
      onBrushCancel: () => uiStore.getState().brushCancel(),
    });
    const unsubscribeLoading = scene.onLoadProgress(setSplashProgress);
    void scene.ready.then(hideSplash);
    scene.setState(gameStore.getState().state);
    const showServiceCoverage = () => scene.setServiceCoverage(uiStore.getState().serviceCoverageOpen ? prefsStore.getState().serviceCoverageType : null);
    showServiceCoverage();
    scene.setGhost(uiStore.getState().evaluation?.ghost ?? null);
    const showAnalytics = () => scene.setAnalyticsLayer(uiStore.getState().analyticsLayer, uiStore.getState().analyticsCategory, uiStore.getState().analyticsBuildingId);
    showAnalytics();
    const showTraffic = () => scene.setTrafficEnabled(prefsStore.getState().traffic && uiStore.getState().analyticsLayer === null);
    showTraffic();
    const showDayCycle = () => scene.setDayCycleOverride(prefsStore.getState().alwaysDay || isAlwaysDayRequested(window.location.search), pinnedCycleHourOf(window.location.search));
    showDayCycle();
    scene.setBrushMode(uiStore.getState().tool?.kind === 'brush');
    const showSelection = () => {
      const state = gameStore.getState().state;
      const selected = state.buildings.find(building => building.id === uiStore.getState().selectedBuildingId);
      scene.setSelection(selectionGhost(state, uiStore.getState().selectedBuildingId, prefsStore.getState().showReach, selected ? scene.drawnExtentOf(selected) : null));
      scene.setEcologicalSelection(uiStore.getState().selectedBuildingId);
      scene.setCoverageFocus(selected && prefsStore.getState().showReach && isFacilityType(selected.type) && FACILITIES[selected.type].radius !== null ? { type: selected.type, facilityId: selected.id } : null);
    };
    showSelection();
    const unsubscribeGame = gameStore.subscribe((store) => {
      scene.setState(store.state);
      showSelection();
    });
    const unsubscribeUi = uiStore.subscribe((store, previous) => {
      if (store.serviceCoverageOpen !== previous.serviceCoverageOpen) showServiceCoverage();
      if (store.analyticsLayer !== previous.analyticsLayer || store.analyticsBuildingId !== previous.analyticsBuildingId || store.analyticsCategory !== previous.analyticsCategory) {
        showTraffic();
        showAnalytics();
      }
      if (store.tool?.kind !== previous.tool?.kind) scene.setBrushMode(store.tool?.kind === 'brush');
      if (store.evaluation !== previous.evaluation) scene.setGhost(store.evaluation?.ghost ?? null);
      if (store.selectedBuildingId !== previous.selectedBuildingId) showSelection();
    });
    const unsubscribeHarvest = harvestEffects.subscribe((effects) => scene.setAfterHarvest(effects.tiles));
    const unsubscribePrefs = prefsStore.subscribe((prefs, previous) => {
      if (prefs.serviceCoverageType !== previous.serviceCoverageType) showServiceCoverage();
      showTraffic();
      if (prefs.alwaysDay !== previous.alwaysDay) showDayCycle();
      if (prefs.showReach !== previous.showReach) showSelection();
    });
    return () => {
      window.clearTimeout(urlTimer);
      window.removeEventListener('popstate', onPopState);
      unsubscribeLoading();
      unsubscribeGame();
      unsubscribePrefs();
      unsubscribeUi();
      unsubscribeHarvest();
      sceneHandle.current = null;
      scene.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="scene-canvas" />;
}
