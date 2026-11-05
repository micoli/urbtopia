import { sourceFactors, type GameState } from '../../core';
import { t } from '../../i18n/t';

const SERIES = [
  { id: 'wind', color: '#7cc4ff', dash: undefined },
  { id: 'solar', color: '#ffd166', dash: undefined },
  { id: 'hydro', color: '#35d07f', dash: undefined },
  { id: 'geothermal', color: '#ff8a65', dash: '6 4' },
] as const;

const DEFAULT_HOURS = 4;
const SAMPLES_PER_HOUR = 12;
const WIDTH = 480;
const HEIGHT = 220;
const MARGIN = { left: 40, right: 12, top: 12, bottom: 28 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_TICKS = [0, 0.5, 1];

const xOf = (hour: number, hours: number) => MARGIN.left + (hour / hours) * PLOT_WIDTH;
const yOf = (factor: number) => MARGIN.top + (1 - factor) * PLOT_HEIGHT;

type SeriesId = (typeof SERIES)[number]['id'];

interface EnergyForecastChartProps {
  state: GameState;
  hours?: number;
  sources?: readonly SeriesId[];
}

export function EnergyForecastChart({ state, hours = DEFAULT_HOURS, sources }: EnergyForecastChartProps) {
  const series = SERIES.filter(({ id }) => !sources || sources.includes(id));
  const hourTicks = Array.from({ length: hours + 1 }, (_, hour) => hour);
  const forecast = Array.from({ length: hours * SAMPLES_PER_HOUR + 1 }, (_, sample) => sourceFactors(state, sample / SAMPLES_PER_HOUR));
  return (
    <figure className="codex-energy-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('codex.energy.forecast')}>
        {Y_TICKS.map(tick => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={yOf(tick)} y2={yOf(tick)} stroke="currentColor" strokeOpacity={0.15} />
            <text x={MARGIN.left - 6} y={yOf(tick)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="currentColor" fillOpacity={0.75}>{Math.round(tick * 100)}%</text>
          </g>
        ))}
        {hourTicks.map(tick => (
          <text key={tick} x={xOf(tick, hours)} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.75}>{tick === 0 ? t('codex.energy.now') : `+${tick}h`}</text>
        ))}
        {series.map(({ id, color, dash }) => (
          <polyline
            key={id}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeDasharray={dash}
            points={forecast.map((factors, sample) => `${xOf(sample / SAMPLES_PER_HOUR, hours)},${yOf(factors[id])}`).join(' ')}
          />
        ))}
      </svg>
      <ul className="codex-energy-legend">
        {series.map(({ id, color, dash }) => (
          <li key={id}>
            <svg width={24} height={8} aria-hidden="true"><line x1={0} x2={24} y1={4} y2={4} stroke={color} strokeWidth={3} strokeDasharray={dash} /></svg>
            {t(`eco.${id}`)}
          </li>
        ))}
      </ul>
    </figure>
  );
}
