import type { BenefitFormat } from '../../codex/interiorFigures';
import { formatPercent } from '../factory/formatPercent';

export const formatBenefit = (value: number, format: BenefitFormat): string => (format === 'percent' ? formatPercent(value) : format === 'power' ? value.toFixed(1) : String(value));
