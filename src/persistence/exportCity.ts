import { gameStore } from '../store/gameStore';
import { downloadText } from './download';
import { serializeEnvelope } from './envelope';
import { saveStore } from './instance';
import { recordExport } from './meta';
import { exportFileName } from './transfer';

export function exportCurrentCity(): void {
  const now = Date.now();
  const { state } = gameStore.getState();
  downloadText(exportFileName(state, now), serializeEnvelope(state, now));
  recordExport(saveStore, now);
}
