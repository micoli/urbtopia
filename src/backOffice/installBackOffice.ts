import { advance } from '../core';
import { applyCameraPose, parseCameraPose } from '../bugReports/cameraPose';
import { parseEnvelope } from '../persistence/envelope';
import { backOfficeStore } from '../store/backOfficeStore';
import { readOnlyStore } from '../store/readOnlyStore';
import { sceneHandle } from '../store/sceneHandle';
import { uiStore } from '../store/uiStore';
import { gameStore } from '../store/gameStore';
import { BACK_OFFICE_ORIGINS, isBackOfficeSessionRequested, READY_MESSAGE, readReportMessage, readSaveMessage, type BackOfficeReport } from './handoff';

export function installBackOffice(): () => void {
  if (!isBackOfficeSessionRequested(window.location.search, import.meta.env.DEV)) return () => {};
  const opener = (window.opener as Window | null) ?? (window.parent === window ? null : window.parent);
  if (!opener) return () => {};

  const openReport = (report: BackOfficeReport) => {
    const parsed = parseEnvelope(report.envelope);
    if (!parsed.ok) return console.warn('back office report refused', parsed.reason);
    readOnlyStore.getState().set(true);
    gameStore.getState().replaceState(parsed.state, 'reset');
    backOfficeStore.getState().setLoaded({ handle: null, revision: report.reportId, report: true });
    const pose = parseCameraPose(report.camera);
    if (pose) applyPoseWhenSceneReady(pose);
  };

  const onMessage = (event: MessageEvent) => {
    const report = readReportMessage(event.origin, event.data);
    if (report) return openReport(report);
    const save = readSaveMessage(event.origin, event.data);
    if (!save) return;
    const parsed = parseEnvelope(save.envelope);
    if (!parsed.ok) return console.warn('back office save refused', parsed.reason);
    readOnlyStore.getState().set(true);
    gameStore.getState().replaceState(advance(parsed.state, Date.now()).state, 'tick');
    backOfficeStore.getState().setLoaded({ handle: save.handle, revision: save.revision });
  };
  window.addEventListener('message', onMessage);
  for (const origin of BACK_OFFICE_ORIGINS) opener.postMessage({ type: READY_MESSAGE }, origin);

  return () => window.removeEventListener('message', onMessage);
}

const SCENE_WAIT_MS = 100;
const SCENE_WAIT_TRIES = 100;

function applyPoseWhenSceneReady(pose: NonNullable<ReturnType<typeof parseCameraPose>>, tries = 0): void {
  const scene = sceneHandle.current;
  if (scene) return applyCameraPose(pose, scene.camera, (level) => uiStore.getState().setLevel(level));
  if (tries < SCENE_WAIT_TRIES) window.setTimeout(() => applyPoseWhenSceneReady(pose, tries + 1), SCENE_WAIT_MS);
}
