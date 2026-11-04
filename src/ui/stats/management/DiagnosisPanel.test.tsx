import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { featureFlagStore } from '../../../featureFlags/featureFlags';
import { prefsStore } from '../../../i18n/prefsStore';
import { DiagnosisPanel } from './DiagnosisPanel';

vi.mock('../../common/hooks', () => ({
  useUi: (selector: (store: { showTile: () => void }) => unknown) => selector({ showTile: () => {} }),
}));

describe('DiagnosisPanel', () => {
  it('renders nothing when the Diagnosis is empty', () => {
    expect(renderToStaticMarkup(<DiagnosisPanel diagnosis={{ causes: [] }} />)).toBe('');
  });

  it('offers the map only for a Cause that has a place', () => {
    prefsStore.getState().setLanguage('en');
    const html = renderToStaticMarkup(<DiagnosisPanel diagnosis={{ causes: [{ key: 'diagnosis.title', weight: 0.5, params: {}, focus: [{ x: 1, y: 2 }] }, { key: 'diagnosis.title', weight: 0.3, params: {}, focus: [] }] }} />);
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('Show on map');
  });

  it('offers an Explain button on each Cause only when the Advisor is on', () => {
    prefsStore.getState().setLanguage('en');
    const diagnosis = { causes: [{ key: 'diagnosis.title' as const, weight: 0.5, params: {}, focus: [] }] };
    // Server rendering reads the initial state: follow the live one so the test can flip the setting.
    prefsStore.getInitialState = prefsStore.getState;
    featureFlagStore.getInitialState = featureFlagStore.getState;
    featureFlagStore.getState().set('advisor', true);
    prefsStore.getState().setAdvisor(false);
    expect(renderToStaticMarkup(<DiagnosisPanel diagnosis={diagnosis} />)).not.toContain('Explain');
    prefsStore.getState().setAdvisor(true);
    expect(renderToStaticMarkup(<DiagnosisPanel diagnosis={diagnosis} />)).toContain('Explain');
    prefsStore.getState().setAdvisor(false);
    expect(renderToStaticMarkup(<DiagnosisPanel diagnosis={diagnosis} />)).not.toContain('Explain');
    prefsStore.getState().setAdvisor(true);
    featureFlagStore.getState().set('advisor', false);
    expect(renderToStaticMarkup(<DiagnosisPanel diagnosis={diagnosis} />)).not.toContain('Explain');
    prefsStore.getState().setAdvisor(false);
  });
});
