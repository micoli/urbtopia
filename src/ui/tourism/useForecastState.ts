import { gameStore } from '../../store/gameStore';
import { useThrottledValue } from '../common/useThrottledValue';

const FORECAST_REFRESH_MS = 3000;

const readState = () => gameStore.getState().state;

// The state a forecast is drawn from: Well-being and the Fame ceiling move slowly, and working them out on every tick is heavy.
export function useForecastState() {
  return useThrottledValue(readState, FORECAST_REFRESH_MS);
}
