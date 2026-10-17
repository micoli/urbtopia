import type {NeedFactorId} from '../../../../core';
import type {MessageKey} from '../../../../i18n/messages';

export function formatSatisfaction(value: number | null): string {
    return value === null ? '—' : value.toFixed(0);
}

const MEASURES: Partial<Record<NeedFactorId, MessageKey>> = {
    electricity: 'needs.measure.electricity',
    water: 'needs.measure.water',
    pollution: 'needs.measure.pollution',
    congestion: 'needs.measure.congestion',
    climate: 'needs.measure.climate',
    leisure: 'needs.measure.leisure',
    walking: 'needs.measure.walking',
    solidarity: 'needs.measure.solidarity',
    greenSpaces: 'needs.measure.green',
    biodiversity: 'needs.measure.green',
};

export function measureKey(id: NeedFactorId): MessageKey {
    return MEASURES[id] ?? 'needs.measure.service';
}

const ORANGE_HUE = 40;
const GREEN_HUE = 120;

export function satisfactionColor(value: number | null): string | undefined {
    if (value === null) return undefined;
    const hue = value < 50 ? value * ORANGE_HUE / 50 : ORANGE_HUE + (value - 50) * (GREEN_HUE - ORANGE_HUE) / 50;
    return `hsl(${hue.toFixed(0)} 70% 60%)`;
}
