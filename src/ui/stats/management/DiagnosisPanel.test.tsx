import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
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
});
