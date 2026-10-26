import { gameStore } from '../store/gameStore';
import { readRegistry } from './cities';
import { downloadText } from './download';
import { openCityId, rawSaveStore, saveStore } from './instance';
import { recordExport } from './meta';
import { exportEnvelope, exportFileName } from './transfer';

export function exportCurrentCity(): void {
  const now = Date.now();
  const { state } = gameStore.getState();
  const cityName = readRegistry(rawSaveStore)?.cities.find((entry) => entry.id === openCityId())?.name ?? null;
  downloadText(exportFileName(state, now), exportEnvelope(state, now, cityName));
  recordExport(saveStore, now);
}
