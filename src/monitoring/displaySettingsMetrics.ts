import * as Sentry from '@sentry/react';
import type { StoreApi } from 'zustand/vanilla';
import type { Prefs } from '../i18n/prefsStore';

export const DISPLAY_SETTINGS = [
  'language',
  'layout',
  'managementTabs',
  'traffic',
  'trafficDensity',
  'pedestrians',
  'pedestrianDensity',
  'pedestrianModel',
  'alwaysDay',
  'fineRotation',
  'showReach',
  'showProductionPreview',
  'showRecipeStock',
  'showAutoProductionBadge',
  'showTaxBadges',
  'taxBadgeThreshold',
  'floatingMenu',
  'floatingRadial',
  'floatingShowDisabled',
  'floatingMove',
  'floatingRotate',
  'floatingRepair',
  'floatingSellBuilding',
  'floatingSell',
  'floatingCollect',
  'floatingInterior',
  'sunShadows',
  'objectShadows',
  'shinyModels',
] as const satisfies readonly (keyof Prefs)[];

export type CountReporter = (name: string, attributes: Record<string, string>) => void;

export const sentryCountReporter: CountReporter = (name, attributes) => {
  Sentry.metrics.count(name, 1, { attributes });
};

// `display_setting` counts the sessions that start with a value; `display_setting_changed` counts the Players who switch it.
export function installDisplaySettingsMetrics(store: StoreApi<Prefs>, report: CountReporter = sentryCountReporter): () => void {
  for (const setting of DISPLAY_SETTINGS) report('display_setting', { setting, value: String(store.getState()[setting]) });
  return store.subscribe((prefs, previous) => {
    for (const setting of DISPLAY_SETTINGS) {
      if (prefs[setting] === previous[setting]) continue;
      report('display_setting_changed', { setting, value: String(prefs[setting]) });
    }
  });
}
